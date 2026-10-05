#!/usr/bin/env python3
"""Convert georeferenced imagery to raster PMTiles using Homebrew GDAL + PMTiles."""

import argparse
from contextlib import ExitStack
from datetime import datetime, timezone
import json
import math
import os
from pathlib import Path
import shlex
import shutil
import sqlite3
import subprocess
import sys
import tempfile

WORLD_METRES = 2 * math.pi * 6378137


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="GeoTIFF file or directory of GeoTIFF tiles (searched recursively)")
    parser.add_argument("output", type=Path, help="Destination .pmtiles file")
    parser.add_argument("--minzoom", type=int, default=0)
    parser.add_argument("--maxzoom", type=int, help="Default: round UP from the source's projected resolution")
    parser.add_argument("--format", choices=("png", "jpeg", "webp"), default="png",
                        help="PNG is lossless and retains alpha; JPEG/WebP are lossy")
    parser.add_argument("--quality", type=int, default=95, help="JPEG/WebP quality, 1–100")
    parser.add_argument("--resampling", choices=("near", "bilinear", "cubic", "lanczos"), default="cubic")
    parser.add_argument("--bands", type=int, nargs="+", help="Select 1 gray, 3 RGB, or 4 RGBA band indices")
    parser.add_argument("--scale", type=float, nargs=2, metavar=("MIN", "MAX"),
                        help="Explicitly map non-Byte colour values to 0–255 (changes pixel values)")
    parser.add_argument("--source-srs", help="Explicit source CRS override, e.g. EPSG:2193")
    parser.add_argument("--attribution", default="", help="Imagery provider and licence credit")
    parser.add_argument("--work-dir", type=Path, help="Scratch volume for MBTiles and converter temporary files")
    parser.add_argument("--cache-mb", type=int, default=512, help="GDAL block cache size")
    parser.add_argument("--warp-memory-mb", type=int, default=256, help="GDAL warp working memory")
    parser.add_argument("--threads", type=int, default=2)
    parser.add_argument("--skip-space-check", action="store_true", help="Bypass conservative disk estimate")
    parser.add_argument("--force", action="store_true", help="Replace existing output after validation")
    args = parser.parse_args()
    source, output = args.input.resolve(), args.output.resolve()
    report_path = output.with_suffix(".raster-conversion.json")
    log_path = output.with_suffix(".raster-conversion.log")
    if not (source.is_file() or source.is_dir()) or output.suffix.lower() != ".pmtiles":
        parser.error("Supply an existing GeoTIFF file/directory and a .pmtiles output")
    inputs = sorted(p.resolve() for p in source.rglob("*") if p.is_file() and
                    p.suffix.lower() in (".tif", ".tiff")) if source.is_dir() else [source]
    if not inputs:
        parser.error("The directory contains no .tif or .tiff files")
    if any("\n" in str(p) or "\r" in str(p) for p in inputs):
        parser.error("TIFF filenames must not contain newline characters")
    if source in (output, report_path, log_path):
        parser.error("Input and output paths must be different")
    if not 0 <= args.minzoom <= 24 or (args.maxzoom is not None and not args.minzoom <= args.maxzoom <= 24):
        parser.error("Zoom levels must satisfy 0 <= minzoom <= maxzoom <= 24")
    if min(args.cache_mb, args.warp_memory_mb, args.threads) <= 0 or not 1 <= args.quality <= 100:
        parser.error("Memory and thread counts must be positive; quality must be 1–100")
    if args.scale and (not all(math.isfinite(v) for v in args.scale) or args.scale[0] >= args.scale[1]):
        parser.error("Scale requires finite MIN < MAX")
    if not args.force and any(p.exists() for p in (output, report_path, log_path)):
        parser.error("Output or sidecar already exists; use --force to replace")
    for name in ("gdalinfo", "gdalbuildvrt", "gdal_translate", "gdalwarp", "gdaladdo", "pmtiles"):
        if not shutil.which(name):
            parser.error("Install tools with: brew install gdal pmtiles")
    output.parent.mkdir(parents=True, exist_ok=True)
    scratch = (args.work_dir or output.parent).resolve()
    scratch.mkdir(parents=True, exist_ok=True)
    environment = dict(os.environ, GDAL_CACHEMAX=str(args.cache_mb),
                       GDAL_NUM_THREADS=str(args.threads), CPL_TMPDIR=str(scratch))
    commands = []

    with ExitStack() as stack:
        work = Path(stack.enter_context(tempfile.TemporaryDirectory(prefix="geotiff-build-", dir=scratch)))
        # Stage the archive on its destination filesystem for an atomic final rename.
        stage = Path(stack.enter_context(tempfile.TemporaryDirectory(prefix=".pmtiles-stage-", dir=output.parent)))
        build_log = stage / "conversion.log"

        def run(command, capture=False):
            command = [str(item) for item in command]
            commands.append(command)
            print("+ " + shlex.join(command), flush=True)
            captured = bytearray()
            with build_log.open("ab") as log:
                log.write(("\n+ " + shlex.join(command) + "\n").encode())
                log.flush()
                # Keep stderr separate from JSON output when inspecting metadata.
                with subprocess.Popen(command, env=environment, stdout=subprocess.PIPE,
                                      stderr=log if capture else subprocess.STDOUT) as process:
                    try:
                        while True:
                            block = os.read(process.stdout.fileno(), 65536)
                            if not block:
                                break
                            log.write(block)
                            log.flush()
                            if capture:
                                captured.extend(block)
                            else:
                                sys.stdout.buffer.write(block)
                                sys.stdout.buffer.flush()
                        if process.wait() != 0:
                            raise RuntimeError(f"Command failed: {shlex.join(command)}")
                    except BaseException:
                        if process.poll() is None:
                            process.terminate()
                            try:
                                process.wait(timeout=5)
                            except subprocess.TimeoutExpired:
                                process.kill()
                                process.wait()
                        raise
            return captured.decode()

        try:
            versions = {"gdal": run(["gdalinfo", "--version"], True).strip(),
                        "pmtiles": run(["pmtiles", "version"], True).strip()}
            raster_source = source
            source_bytes = sum(p.stat().st_size for p in inputs)
            if source.is_dir():
                print(f"Mosaicking {len(inputs)} GeoTIFFs ({source_bytes / 1024**3:.2f} GiB) using a virtual dataset.", flush=True)
                # Fail instead of silently omitting incompatible or unreadable tiles.
                # Non-image downloads (PDFs, metadata, etc.) are deliberately ignored.
                for item in inputs:
                    tile_info = json.loads(run(["gdalinfo", "-json", item], True))
                    if tile_info.get("driverShortName") != "GTiff":
                        raise RuntimeError(f"Not a GeoTIFF: {item}")
                manifest = work / "input-files.txt"
                manifest.write_text("\n".join(map(str, inputs)) + "\n")
                raster_source = work / "mosaic.vrt"
                run(["gdalbuildvrt", "-strict", "-resolution", "highest", "-addalpha",
                     "-input_file_list", manifest, raster_source])
            info = json.loads(run(["gdalinfo", "-json", raster_source], True))
            if info.get("driverShortName") not in ("GTiff", "COG", "VRT"):
                raise RuntimeError("Input must be GeoTIFF imagery")
            if not (args.source_srs or info.get("coordinateSystem") or info.get("gcps", {}).get("coordinateSystem")):
                raise RuntimeError("Input has no CRS. Specify --source-srs only if you know its correct CRS")
            if not (info.get("geoTransform") or info.get("gcps")):
                raise RuntimeError("Input has no affine georeferencing or ground control points")
            bands = info["bands"]
            selected = args.bands or list(range(1, len(bands) + 1))
            if any(index < 1 or index > len(bands) for index in selected):
                raise RuntimeError("Selected band index is outside the source band range")
            chosen = [bands[index - 1] for index in selected]
            interpretations = [b.get("colorInterpretation", "Undefined") for b in chosen]
            palette = len(chosen) == 1 and interpretations == ["Palette"]
            if args.bands:
                if len(selected) not in (1, 3, 4):
                    raise RuntimeError("--bands requires 1 gray, 3 RGB, or 4 RGBA bands")
                interpretations = {1: ["Gray"], 3: ["Red", "Green", "Blue"],
                                   4: ["Red", "Green", "Blue", "Alpha"]}[len(selected)]
            elif interpretations not in (["Gray"], ["Gray", "Alpha"], ["Red", "Green", "Blue"],
                                          ["Red", "Green", "Blue", "Alpha"], ["Palette"]):
                raise RuntimeError("Ambiguous/multispectral band layout. Choose display bands explicitly with --bands")
            if any(b["type"] != "Byte" for b in chosen) and not args.scale:
                raise RuntimeError("Imagery tiles require 8-bit display values. Use --scale MIN MAX explicitly for non-Byte imagery")
            if any(role == "Alpha" and band["type"] != "Byte" for role, band in zip(interpretations, chosen)):
                raise RuntimeError("Non-Byte alpha requires separate preparation; select RGB bands with --bands")
            if palette and args.scale:
                raise RuntimeError("Palette imagery must not be scaled")
            prepared = work / "source.vrt"
            translate = ["gdal_translate", "-of", "VRT"]
            if args.bands:
                for index in selected:
                    translate += ["-b", index]
            if palette:
                translate += ["-expand", "rgba"]
            else:
                translate += ["-colorinterp", ",".join(role.lower() for role in interpretations)]
            if args.scale:
                translate += ["-ot", "Byte"]
                for index, role in enumerate(interpretations, 1):
                    if role != "Alpha":
                        translate += [f"-scale_{index}", *args.scale, 0, 255]
            run([*translate, raster_source, prepared])
            crs_override = ["-s_srs", args.source_srs] if args.source_srs else []
            probe = work / "projected.vrt"
            # This is metadata-only: no full intermediate TIFF is created.
            run(["gdalwarp", "-of", "VRT", *crs_override, "-t_srs", "EPSG:3857",
                 "-dstalpha", "-ovr", "NONE", prepared, probe])
            projected = json.loads(run(["gdalinfo", "-json", probe], True))
            transform = projected["geoTransform"]
            native_resolution = min(abs(transform[1]), abs(transform[5]))
            if not math.isfinite(native_resolution) or native_resolution <= 0:
                raise RuntimeError("Could not determine projected source resolution")
            suggested_zoom = max(0, math.ceil(math.log2(WORLD_METRES / (256 * native_resolution)) - 1e-9))
            zoom = args.maxzoom if args.maxzoom is not None else suggested_zoom
            if not args.minzoom <= zoom <= 24:
                raise RuntimeError(f"Suggested maxzoom is {zoom}; explicitly choose zooms in 0–24")
            resolution = WORLD_METRES / (256 * 2 ** zoom)
            width = math.ceil(projected["size"][0] * abs(transform[1]) / resolution) + 2
            height = math.ceil(projected["size"][1] * abs(transform[5]) / resolution) + 2
            # Conservative, based on uncompressed RGBA, overviews and conversion scratch.
            raw_bytes = width * height * 4
            work_required = raw_bytes * 4 + 1024 ** 3
            output_required = raw_bytes * 2 + 1024 ** 3
            same_volume = os.stat(work).st_dev == os.stat(stage).st_dev
            required = work_required + output_required if same_volume else work_required
            print(f"Maximum zoom {zoom}; projected pixel size {resolution:.6f} m; "
                  f"approximately {width:,} × {height:,} pixels.", flush=True)
            print(f"Conservative scratch estimate: {work_required / 1024**3:.1f} GiB; "
                  f"destination estimate: {output_required / 1024**3:.1f} GiB. "
                  "Actual compressed sizes vary.", flush=True)
            if not args.skip_space_check and (shutil.disk_usage(work).free < required or
                    (not same_volume and shutil.disk_usage(stage).free < output_required)):
                raise RuntimeError("Insufficient free disk for the conservative estimate. Choose a larger "
                                   "--work-dir/destination, or explicitly use --skip-space-check")
            if zoom < suggested_zoom:
                print("WARNING: requested maxzoom downsamples the source imagery.", flush=True)
            if args.format != "png":
                print("WARNING: JPEG/WebP encoding is lossy; JPEG also discards transparency.", flush=True)
            mbtiles = work / "imagery.mbtiles"
            run(["gdalwarp", "-of", "MBTiles", *crs_override, "-t_srs", "EPSG:3857",
                 "-tr", resolution, resolution, "-tap", "-dstalpha", "-ovr", "NONE", "-et", "0",
                 "-r", args.resampling, "-wm", args.warp_memory_mb, "-multi",
                 "-wo", f"NUM_THREADS={args.threads}", "-co", f"TILE_FORMAT={args.format.upper()}",
                 "-co", f"QUALITY={args.quality}", "-co", "BLOCKSIZE=256",
                 "-co", f"NAME={output.stem}", "-co", "TYPE=baselayer", prepared, mbtiles])
            factors = [2 ** i for i in range(1, zoom - args.minzoom + 1)]
            if factors:
                run(["gdaladdo", "-r", "average", "-oo", f"TILE_FORMAT={args.format.upper()}",
                     "-oo", f"QUALITY={args.quality}", mbtiles, *factors])
            with sqlite3.connect(mbtiles) as database:
                if args.attribution:
                    database.execute("DELETE FROM metadata WHERE name='attribution'")
                    database.execute("INSERT INTO metadata(name,value) VALUES('attribution',?)", (args.attribution,))
                zoom_counts = database.execute("SELECT zoom_level, COUNT(*) FROM tiles GROUP BY zoom_level").fetchall()
                if not zoom_counts or zoom_counts[-1][0] != zoom or zoom_counts[0][0] < args.minzoom:
                    raise RuntimeError("Output has no imagery or does not contain the requested maximum zoom")
                if zoom_counts[0][0] > args.minzoom:
                    print(f"Note: the lowest nonempty zoom is {zoom_counts[0][0]}; "
                          "very small footprints can disappear into transparent overview pixels.", flush=True)
                sample = database.execute("SELECT zoom_level,tile_column,tile_row FROM tiles "
                                          "ORDER BY zoom_level DESC LIMIT 1").fetchone()
            archive = stage / "map.pmtiles"
            run(["pmtiles", "convert", mbtiles, archive, f"--tmpdir={work}"])
            run(["pmtiles", "verify", archive])
            header = json.loads(run(["pmtiles", "show", archive, "--header-json"], True))
            expected_type = {"png": "png", "jpeg": "jpg", "webp": "webp"}[args.format]
            if header["tile_type"] not in (expected_type, args.format):
                raise RuntimeError(f"Unexpected archive tile type: {header['tile_type']}")
            # Decode one actual highest-zoom tile, beyond merely checking archive structure.
            z, x, tms_y = sample
            sample_file = work / f"sample.{expected_type}"
            tile_command = ["pmtiles", "tile", str(archive), str(z), str(x), str(2 ** z - 1 - tms_y)]
            commands.append(tile_command)
            with sample_file.open("wb") as tile, build_log.open("ab") as log:
                subprocess.run(tile_command, stdout=tile, stderr=log, check=True, env=environment)
            sample_info = json.loads(run(["gdalinfo", "-json", sample_file], True))
            if sample_info["size"] != [256, 256]:
                raise RuntimeError("Decoded raster tile has an unexpected size")
            report = {
                "created_utc": datetime.now(timezone.utc).isoformat(), "source": str(source),
                "source_bytes": source_bytes, "source_files": list(map(str, inputs)),
                "source_file_count": len(inputs), "source_size": info["size"],
                "source_band_types": [b["type"] for b in bands], "selected_bands": selected,
                "source_srs_override": args.source_srs, "scale": args.scale,
                "projected_native_resolution_metres": native_resolution, "suggested_maxzoom": suggested_zoom,
                "output_resolution_metres": resolution, "archive": header,
                "requested_minzoom": args.minzoom, "requested_maxzoom": args.maxzoom,
                "tile_counts_by_zoom": dict(zoom_counts), "encoding": args.format,
                "quality": args.quality if args.format != "png" else None,
                "resampling": args.resampling, "attribution": args.attribution,
                "cache_mb": args.cache_mb, "warp_memory_mb": args.warp_memory_mb, "threads": args.threads,
                "versions": versions, "commands": commands,
                "validation": {"pmtiles_verify": "passed", "sample_tile_decode": "passed"},
                "notes": ["Original GeoTIFF is unchanged; Web Mercator reprojection resamples pixels.",
                          "PNG tile encoding is lossless, but resampling and explicit scaling are not.",
                          "Overview zooms use averaged pixels. Output is raster PMTiles, not vector data.",
                          "RAM controls bound GDAL caches, not the total memory of every library/tool."],
            }
            staged_report = stage / "report.json"
            staged_report.write_text(json.dumps(report, indent=2) + "\n")
            os.replace(staged_report, report_path)
            os.replace(build_log, log_path)
            os.replace(archive, output)
            print(f"Created {output} ({output.stat().st_size:,} bytes). Report: {report_path}")
            return 0
        except (OSError, ValueError, KeyError, RuntimeError, subprocess.SubprocessError, sqlite3.Error, KeyboardInterrupt) as error:
            failure_log = output.with_suffix(".raster-failed.log")
            if build_log.exists():
                shutil.copyfile(build_log, failure_log)
            print(f"Conversion failed: {error or 'interrupted'}\nLog: {failure_log}", file=sys.stderr)
            return 1


if __name__ == "__main__":
    sys.exit(main())
