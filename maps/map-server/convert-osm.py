#!/usr/bin/env python3
"""Build detailed vector PMTiles using Homebrew's Osmium, Tippecanoe and PMTiles."""

import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import shlex
import shutil
import sqlite3
import subprocess
import sys
import tempfile


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="Current OSM XML or OSM PBF (not history)")
    parser.add_argument("output", type=Path, help="Destination .pmtiles")
    parser.add_argument("--minzoom", type=int, default=0)
    parser.add_argument("--maxzoom", type=int, default=18)
    parser.add_argument("--allow-incomplete", action="store_true",
                        help="Allow missing OSM references/invalid geometry; log omissions")
    parser.add_argument("--force", action="store_true", help="Replace existing output and sidecars")
    args = parser.parse_args()
    source, output = args.input.resolve(), args.output.resolve()
    if not source.is_file() or output.suffix.lower() != ".pmtiles":
        parser.error("Provide an existing OSM input and a .pmtiles output")
    if not 0 <= args.minzoom <= args.maxzoom <= 22:
        parser.error("Zooms must satisfy 0 <= minzoom <= maxzoom <= 22")
    # Tippecanoe's global coordinate grid has 32 bits; extent 8192 is supported
    # by MapLibre and gives ~1.4 cm grid spacing at z18 / latitude 41 degrees.
    detail = min(13, 32 - args.maxzoom)
    destinations = {
        "tiles": output,
        "source": output.with_suffix(".source.osm.pbf"),
        "report": output.with_suffix(".conversion.json"),
        "log": output.with_suffix(".conversion.log"),
    }
    if source in destinations.values():
        parser.error("Input cannot also be an output or sidecar")
    if not args.force and any(p.exists() for p in destinations.values()):
        parser.error("An output or sidecar exists; use --force to replace it")
    for executable in ("osmium", "tippecanoe", "tippecanoe-decode", "pmtiles"):
        if shutil.which(executable) is None:
            parser.error("Install tools: brew install osmium-tool tippecanoe pmtiles")
    output.parent.mkdir(parents=True, exist_ok=True)
    commands = []
    print("Vector tiles are a display format, not a lossless OSM database. "
          "The .source.osm.pbf sidecar retains the complete input data model.", flush=True)

    with tempfile.TemporaryDirectory(prefix=".osm-build-", dir=output.parent) as tmp:
        work = Path(tmp)
        log_path = work / "conversion.log"

        def run(command, capture=False, allow_failure=False):
            command = [str(item) for item in command]
            commands.append(command)
            print("+ " + shlex.join(command), flush=True)
            with log_path.open("a") as log:
                log.write("\n+ " + shlex.join(command) + "\n")
                log.flush()
                result = subprocess.run(command, stdout=subprocess.PIPE if capture else log,
                                        stderr=log, text=True)
            if result.returncode and not allow_failure:
                raise RuntimeError(f"Command exited {result.returncode}: {shlex.join(command)}")
            return result

        try:
            info = json.loads(run(["osmium", "fileinfo", "-e", "-j", source], capture=True).stdout)
            if info["header"].get("with_history") or info["data"].get("multiple_versions"):
                raise RuntimeError("History files require a snapshot before conversion")
            references = run(["osmium", "check-refs", "--check-relations", source], allow_failure=True)
            if references.returncode and not args.allow_incomplete:
                raise RuntimeError("Input has missing references. Obtain a complete extract, or use "
                                   "--allow-incomplete to retain only the geometry available in this input")

            complete_source = work / "source.osm.pbf"
            run(["osmium", "cat", source, "-o", complete_source])
            retained = json.loads(run(["osmium", "fileinfo", "-e", "-j", complete_source], capture=True).stdout)
            if info["data"]["crc32"] != retained["data"]["crc32"]:
                raise RuntimeError("OSM source sidecar failed the object-content checksum check")

            features = work / "features.geojsonseq"
            export = ["osmium", "export", complete_source, "--keep-untagged",
                      "--add-unique-id=counter", "--show-errors", "--verbose",
                      "-x", "print_record_separator=false", "-o", features]
            if not args.allow_incomplete:
                export.append("--stop-on-error")
            run(export)
            geometry_counts, tag_counts = Counter(), Counter()
            untagged = 0
            # A disk-backed index keeps the audit bounded in memory for large extracts.
            audit = sqlite3.connect(work / "feature-audit.sqlite")
            audit.execute("CREATE TABLE features (id INTEGER PRIMARY KEY, tags BLOB, seen INTEGER DEFAULT 0)")

            def tag_digest(properties):
                return hashlib.sha256(json.dumps(properties, sort_keys=True,
                    separators=(",", ":")).encode()).digest()

            with features.open() as stream:
                for line in stream:
                    feature = json.loads(line)
                    geometry_counts[feature["geometry"]["type"]] += 1
                    tag_counts.update(feature["properties"].keys())
                    untagged += not feature["properties"]
                    audit.execute("INSERT INTO features(id, tags) VALUES (?, ?)",
                                  (feature["id"], tag_digest(feature["properties"])))
            audit.commit()
            if not geometry_counts:
                raise RuntimeError("No geometry was exported")
            print(f"Exported {sum(geometry_counts.values()):,} features, including "
                  f"{untagged:,} untagged features; {len(tag_counts)} distinct tag keys.", flush=True)

            tiles = work / "map.pmtiles"
            # No category filter, bbox clip, feature thinning, tag exclusion,
            # size-triggered dropping, simplification or tiny-polygon replacement.
            run(["tippecanoe", "--output", tiles, "--layer=osm",
                 f"--minimum-zoom={args.minzoom}", f"--maximum-zoom={args.maxzoom}",
                 f"--full-detail={detail}", f"--low-detail={detail}",
                 f"--minimum-detail={detail}", "--drop-rate=1", "--base-zoom=0",
                 "--no-feature-limit", "--no-tile-size-limit", "--no-line-simplification",
                 "--no-tiny-polygon-reduction", "--preserve-input-order", "--read-parallel",
                 "--name=" + output.stem, "--progress-interval=10",
                 "--attribution=© OpenStreetMap contributors; https://www.openstreetmap.org/copyright",
                 features])
            run(["pmtiles", "verify", tiles])
            print("Auditing feature IDs and tags across decoded tiles...", flush=True)
            decode_command = ["tippecanoe-decode", "--tag-layer-and-zoom", str(tiles)]
            commands.append(decode_command)
            instances = 0
            with log_path.open("a") as log:
                log.write("\n+ " + shlex.join(decode_command) + "\n")
                log.flush()
                with subprocess.Popen(decode_command, stdout=subprocess.PIPE, stderr=log,
                                      text=True) as decoder:
                    try:
                        for line in decoder.stdout:
                            if not line.strip():
                                continue
                            feature = json.loads(line)
                            updated = audit.execute(
                                "UPDATE features SET seen=1 WHERE id=? AND tags=?",
                                (feature["id"], tag_digest(feature["properties"])))
                            if updated.rowcount != 1:
                                raise RuntimeError(f"Tile audit found altered tags or an unexpected feature ID: {feature['id']}")
                            instances += 1
                    except BaseException:
                        decoder.kill()
                        raise
                    if decoder.wait() != 0:
                        raise RuntimeError("Tile decoder failed during feature audit")
            missing = audit.execute("SELECT COUNT(*) FROM features WHERE seen=0").fetchone()[0]
            audit.close()
            if missing:
                raise RuntimeError(f"{missing} exported features did not survive tiling. "
                                   "Try a higher --maxzoom; the original data remains in the input")
            header = json.loads(run(["pmtiles", "show", tiles, "--header-json"], capture=True).stdout)
            digest = hashlib.sha256()
            with source.open("rb") as stream:
                for block in iter(lambda: stream.read(1024 * 1024), b""):
                    digest.update(block)
            report = {
                "created_utc": datetime.now(timezone.utc).isoformat(),
                "source": str(source), "source_sha256": digest.hexdigest(),
                "source_object_counts": info["data"]["count"],
                "source_object_crc32": info["data"]["crc32"],
                "source_sidecar_crc32": retained["data"]["crc32"],
                "reference_check_passed": references.returncode == 0,
                "allow_incomplete": args.allow_incomplete,
                "exported_geometry_counts": dict(geometry_counts),
                "exported_feature_count": sum(geometry_counts.values()),
                "exported_untagged_count": untagged,
                "tag_key_feature_counts": dict(sorted(tag_counts.items())),
                "tile_feature_audit": {"passed": True, "unique_features": sum(geometry_counts.values()),
                                       "tile_feature_instances": instances, "missing_features": missing,
                                       "changed_tags": 0},
                "archive": header, "tile_extent": 2 ** detail,
                "commands": commands,
                "limits": [
                    "OSM contains tags and geometry, not original rendering colours or display layers.",
                    "All exported features share the osm source layer; all OSM tag keys are retained.",
                    "OSM export does not translate non-area relations (routes, restrictions, etc.) into geometry.",
                    "Missing references and invalid polygons cannot be rendered; inspect the conversion log.",
                    "Tile coordinates are quantized and tile boundaries clip geometry. Sub-grid geometry may collapse.",
                    "Audit checks that each exported feature ID and its exact tags occur in at least one tile, not at every zoom.",
                    "No deliberate feature thinning, simplification, tag filtering or geographic cropping is enabled.",
                    "The source PBF preserves the original objects, tags, relations and coordinates for lossless use.",
                    "Detailed tiles can be large; styling and label collisions affect visibility, not stored tags.",
                ],
            }
            report_path = work / "conversion.json"
            report_path.write_text(json.dumps(report, indent=2) + "\n")
            # Replace the PMTiles only once conversion and validation succeed.
            for staged, key in [(complete_source, "source"), (report_path, "report"),
                                (log_path, "log"), (tiles, "tiles")]:
                os.replace(staged, destinations[key])
            print(f"Created {output} ({output.stat().st_size:,} bytes)", flush=True)
            print(f"Report: {destinations['report']}", flush=True)
            if references.returncode:
                print("WARNING: input has missing relation members; see the report and log.", file=sys.stderr)
        except (RuntimeError, subprocess.SubprocessError, OSError, ValueError) as error:
            failure_log = output.with_suffix(".failed.log")
            if log_path.exists():
                shutil.copyfile(log_path, failure_log)
            print(f"Conversion failed: {error}\nLog: {failure_log}", file=sys.stderr)
            return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
