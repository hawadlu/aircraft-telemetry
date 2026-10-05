"""Integration tests using the installed GDAL and PMTiles CLIs."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

CONVERTER = Path(__file__).with_name("convert-geotiff.py")


def create_image(path, x=1766000, dtype="Byte", crs=True):
    command = ["gdal_create", "-of", "GTiff", "-outsize", "32", "32", "-bands", "3",
               "-burn", "35", "-burn", "140", "-burn", "65", "-ot", dtype,
               "-a_ullr", str(x), "5465000", str(x + 2.4), "5464997.6"]
    if crs:
        command += ["-a_srs", "EPSG:2193"]
    subprocess.run([*command, str(path)], check=True, capture_output=True)


def convert(source, output, *options):
    return subprocess.run([sys.executable, str(CONVERTER), str(source), str(output),
                           "--minzoom=20", "--maxzoom=21", *options], text=True, capture_output=True)


class GeoTIFFTests(unittest.TestCase):
    def test_directory_mosaic_png_alpha_and_sources_unchanged(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            inputs = root / "tiles with spaces"
            inputs.mkdir()
            for name, x in [("first.tif", 1766000), ("second.TIFF", 1766002.4)]:
                create_image(inputs / name, x)
            (inputs / "licence.txt").write_text("Not an image")
            before = {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in inputs.iterdir()}
            output = root / "mosaic.pmtiles"
            result = convert(inputs, output, "--attribution", "Test provider")
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            report = json.loads(output.with_suffix(".raster-conversion.json").read_text())
            self.assertEqual(report["source_file_count"], 2)
            self.assertEqual(report["source_size"], [64, 32])
            self.assertEqual(report["archive"]["tile_type"], "png")
            self.assertEqual(report["archive"]["maxzoom"], 21)
            self.assertEqual(report["validation"]["sample_tile_decode"], "passed")
            metadata = json.loads(subprocess.check_output(["pmtiles", "show", str(output), "--metadata"], text=True))
            self.assertEqual(metadata["attribution"], "Test provider")
            self.assertEqual(before, {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in inputs.iterdir()})

    def test_missing_crs_does_not_replace_output(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source, output = root / "no-crs.tif", root / "old.pmtiles"
            create_image(source, crs=False)
            output.write_bytes(b"old map")
            result = convert(source, output, "--force")
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("no CRS", result.stderr)
            self.assertEqual(output.read_bytes(), b"old map")

    def test_nonbyte_requires_explicit_scale(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source, output = root / "sixteen-bit.tif", root / "scaled.pmtiles"
            create_image(source, dtype="UInt16")
            result = convert(source, output, "--bands", "1", "2", "3")
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("--scale", result.stderr)
            result = convert(source, output, "--bands", "1", "2", "3", "--scale", "0", "255")
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main()
