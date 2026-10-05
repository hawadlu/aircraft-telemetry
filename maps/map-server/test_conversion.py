"""Integration tests against the installed open-source conversion tools."""
import json
import math
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


CONVERTER = Path(__file__).with_name("convert-osm.py")
FIXTURE = '''<osm version="0.6" generator="test">
<node id="1" lat="-40.95801" lon="174.97301" version="1"/>
<node id="2" lat="-40.95801" lon="174.97302" version="1">
  <tag k="name" v="A very small feature"/><tag k="unusual:tag" v="00123"/>
  <tag k="colour" v="#12ab34"/><tag k="rare" v="yes"/>
</node>
<node id="3" lat="-40.95802" lon="174.97302" version="1"/>
<node id="4" lat="-40.95802" lon="174.97301" version="1"/>
<way id="10" version="1"><nd ref="1"/><nd ref="2"/><nd ref="3"/><nd ref="4"/><nd ref="1"/>
  <tag k="building" v="shed"/><tag k="custom:field" v="retain me"/>
</way>
<relation id="20" version="1"><member type="way" ref="10" role=""/>
  <tag k="type" v="route"/><tag k="route" v="foot"/><tag k="name" v="Test route"/>
</relation></osm>'''


class ConversionTests(unittest.TestCase):
    def test_geometry_tags_untagged_nodes_and_original_relation_survive(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source, output = root / "input.osm", root / "map.pmtiles"
            source.write_text(FIXTURE)
            subprocess.run([sys.executable, str(CONVERTER), str(source), str(output),
                            "--minzoom=18", "--maxzoom=18"], check=True, capture_output=True)
            report = json.loads(output.with_suffix(".conversion.json").read_text())
            self.assertEqual(report["source_object_counts"]["relations"], 1)
            self.assertEqual(report["source_object_crc32"], report["source_sidecar_crc32"])
            self.assertEqual(report["exported_geometry_counts"]["Point"], 4)
            self.assertEqual(report["exported_untagged_count"], 3)
            z = 18
            x = int((174.97301 + 180) / 360 * 2 ** z)
            y = int((1 - math.asinh(math.tan(math.radians(-40.95801))) / math.pi) / 2 * 2 ** z)
            decoded = json.loads(subprocess.check_output([
                "tippecanoe-decode", str(output), str(z), str(x), str(y)], text=True))
            features = [f for layer in decoded["features"] for f in layer["features"]]
            self.assertEqual(sum(f["geometry"]["type"] == "Point" for f in features), 4)
            rare = next(f for f in features if "rare" in f["properties"])
            self.assertEqual(rare["properties"], {"name": "A very small feature", "unusual:tag": "00123",
                                                  "colour": "#12ab34", "rare": "yes"})
            self.assertTrue(any(f["geometry"]["type"] in ("Polygon", "MultiPolygon") and
                                f["properties"].get("custom:field") == "retain me" for f in features))

    def test_missing_references_fail_without_replacing_previous_map(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source, output = root / "broken.osm", root / "map.pmtiles"
            source.write_text(FIXTURE.replace('ref="10" role=""', 'ref="999" role=""'))
            output.write_bytes(b"previous map")
            result = subprocess.run([sys.executable, str(CONVERTER), str(source), str(output), "--force"],
                                    capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("missing references", result.stderr)
            self.assertEqual(output.read_bytes(), b"previous map")
            self.assertTrue(output.with_suffix(".failed.log").is_file())


if __name__ == "__main__":
    unittest.main()
