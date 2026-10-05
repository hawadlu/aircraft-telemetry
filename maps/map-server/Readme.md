# Local detailed map server

For aerial/satellite GeoTIFFs (including the supplied Kāpiti Coast directory),
see [GeoTIFF conversion instructions](GEOTIFF.md). The server and UI accept both
vector PMTiles and raster PNG/JPEG/WebP PMTiles.

Install the conversion tools through Homebrew, then install the Node dependencies:

```sh
brew install osmium-tool tippecanoe pmtiles
cd maps/map-server # from the repository root
npm install
npm start -- queenElizabethPark
```

The server accepts a map name, `.pmtiles` filename, or explicit path. Bare names
resolve under `maps/map-data`; explicit relative paths resolve from the current
working directory. Without an argument it selects `map.pmtiles`. `PORT` overrides
port 3000. Restart after changing or regenerating an archive.

- `/maps/map.pmtiles` always serves the selected map, with HTTP byte-range support.
- `/maps/style.json` builds an OpenStreetMap-like style from **every source layer**
  advertised by that archive, including fallback styling for unfamiliar layers.
- Other files remain available by filename under `/maps`.

`learningLabs/06-map-ui/02` loads the style and archive through its Vite proxy.
The renderer includes land use, water, buildings, roads, paths, railways, other
lines, POIs, labels and addresses. Click features to inspect their stored tags.
MapLibre 6 uses local fonts, so labels do not require a remote font server.
This is an OSM-like style, not a pixel-for-pixel reproduction of osm.org's Carto
style. A third-party archive with a different schema may need its own style to
interpret its attributes correctly, even though every layer receives a fallback.

## Convert an OSM extract

The Python wrapper uses the standard library to invoke **Osmium, Tippecanoe and
PMTiles**. It does not implement geometry conversion, hand-classify features, or
filter tag categories. It accepts `.osm` and `.osm.pbf` snapshot files.

From `maps/map-server`, with Python 3.9 or newer:

```sh
# Complete source: missing references or geometry errors stop the conversion.
python3 convert-osm.py ../map-data/input.osm.pbf ../map-data/output.pmtiles

# The supplied park XML has incomplete relations. This explicit option permits
# rendering the geometry available in it; the report/log records the limitation.
python3 convert-osm.py ../map-data/queenElizabethPark.osm \
  ../map-data/queenElizabethPark.pmtiles --allow-incomplete --force

# Example for the downloaded national extract. This is substantially more work.
python3 convert-osm.py ../map-data/new-zealand-261002.osm.pbf \
  ../map-data/newZealand.pmtiles --force

pmtiles verify ../map-data/queenElizabethPark.pmtiles
npm start -- queenElizabethPark
```

The national archive is **not regenerated automatically** by the park command.
A file merely named `.pmtiles` is not necessarily PMTiles; the server now checks
it using the official PMTiles reader and rejects invalid archives.

Default zooms are 0–18 with extent 8192. `--maxzoom 19` provides approximately
1 cm global grid precision; zooms up to 22 are supported. More zoom levels do
not improve the accuracy of the original survey and can greatly increase output
size and conversion time. Detailed country-wide tiles, especially at low zooms,
can be large and slow to render. `--minzoom` can omit unwanted overview levels
without thinning features in the remaining levels. No bbox clipping is applied:
complete ways extending outside the source's advertised bounds remain included.

The conversion explicitly disables point thinning, feature/byte size limits,
line/polygon simplification, and replacement of tiny polygons with simplified
squares. All exportable geometry, including untagged nodes and unusual tag keys,
is sent to one vector source layer called `osm`. OSM itself does not define map
rendering layers, so that name does not represent a loss of source layers.
Colour-related tags are retained; display colours are chosen by `map-style.js`.

Each successful conversion produces:

| File | Contents |
| --- | --- |
| `name.pmtiles` | Detailed vector tiles for the viewer |
| `name.source.osm.pbf` | Complete original OSM objects, including relation membership and metadata |
| `name.conversion.json` | Object/feature counts, tag-key inventory, tile audit, source checksum, archive settings, exact commands and limitations |
| `name.conversion.log` | Tool output and missing-reference/geometry diagnostics |

The source PBF's OSM object-content CRC is compared with the input before
publishing. The wrapper also decodes the complete archive and verifies that
**every exported feature ID and its exact tags occur in the tiles**. This audit
uses a disk-backed SQLite index and fails on missing features or altered tags.
It checks presence somewhere in the archive, not visibility at every zoom or
exact coordinate equality (coordinates are quantized). Existing output is
replaced only with `--force`, after archive validation and this audit succeed.
Failed conversions leave the old archive in place and
write `name.failed.log`. Intermediate build files are removed automatically.

## What cannot be preserved inside vector tiles

OSM contains geometry and tags, **not original map colours, fonts or a map style**.
The original OSM graph also contains route/restriction relations and metadata
that do not translate into drawable geometry. Osmium documents that export is
not lossless; non-area relation semantics stay in the source PBF rather than
being misrepresented as geometry in PMTiles.

Vector tiles quantize coordinates and split geometry at tile boundaries.
Features below the coordinate grid can collapse at overview zooms even with
simplification disabled. The source PBF remains the lossless data copy. Labels
may be hidden by collision handling or zoom thresholds, but their tags remain
in the tiles. A PMTiles file cannot supply geometry absent from the input.

The supplied park XML has 51,864 nodes, 4,176 ways and 78 relations. Its references
include 75 missing relation nodes, 5,883 missing relation ways and 8 missing
relation relations. All way-node references are present. The generated archive
contains 58,745 exported geometries, including 47,754 untagged features and 281
distinct tag keys. Some ways produce both a line and an area. Ocean/island fills
are not fabricated from incomplete coastline segments; use a complete basemap
or additional coastline data if that is required.

## Equivalent library commands

These are the core commands wrapped by Python. Run from `maps/map-server`.
The park requires omitting `--stop-on-error`; inspect `osmium check-refs` output
first. Use a complete source for the strict example below.

```sh
map_input=../map-data/input.osm.pbf
map_build_dir=$(mktemp -d)
osmium check-refs --check-relations "$map_input"
osmium cat "$map_input" -o "$map_build_dir/source.osm.pbf"
osmium export "$map_build_dir/source.osm.pbf" \
  --keep-untagged --add-unique-id=counter --show-errors --stop-on-error \
  -x print_record_separator=false -o "$map_build_dir/features.geojsonseq"
tippecanoe --output "$map_build_dir/map.pmtiles" --layer=osm \
  --minimum-zoom=0 --maximum-zoom=18 \
  --full-detail=13 --low-detail=13 --minimum-detail=13 \
  --drop-rate=1 --base-zoom=0 --no-feature-limit --no-tile-size-limit \
  --no-line-simplification --no-tiny-polygon-reduction \
  --preserve-input-order --read-parallel \
  --attribution='© OpenStreetMap contributors; https://www.openstreetmap.org/copyright' \
  "$map_build_dir/features.geojsonseq"
pmtiles verify "$map_build_dir/map.pmtiles"
```

Stop if any command fails. The Python wrapper provides error handling, checksum
verification, reports and publication to the destination path around these tools.

References: [Osmium export](https://docs.osmcode.org/osmium/latest/osmium-export.html),
[Tippecanoe](https://github.com/felt/tippecanoe),
[PMTiles CLI](https://docs.protomaps.com/pmtiles/cli).

## Checks

```sh
python3 test_conversion.py
node --check server.js
# From learningLabs/06-map-ui/02:
npm run build
```

The conversion tests decode generated tiles and check uncommon tags, colour tags,
untagged nodes and a tiny polygon. They also verify relation preservation in the
source PBF and that incomplete input cannot overwrite a good archive by default.
