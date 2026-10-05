# Local PMTiles map

## Work laptop: view an already converted map

You need Node.js/npm and a browser with WebGL support. Install Node using an
approved installer; Homebrew is not required. The repository's `.nvmrc` records
the development Node version.

Copy a converted `.pmtiles` archive from your personal laptop into
`maps/map-data`. From the repository root, start the map server (replace
`queenElizabethPark` with the copied archive's name):

```sh
cd maps/map-server
npm install
npm start -- queenElizabethPark
```

In a second terminal, from the repository root:

```sh
cd learningLabs/06-map-ui/02
npm install
npm run dev
```

Both projects use npm dependencies only for serving/rendering. The server reads
PMTiles metadata with the `pmtiles` JavaScript package; this lab uses `pmtiles`
for archive byte ranges and MapLibre GL JS for browser rendering. No PMTiles
CLI, GDAL, Osmium, Tippecanoe, Python or other Homebrew libraries are needed.

Open the URL printed by Vite. `/maps` is proxied to port 3000. The server selects
an archive and exposes it at `/maps/map.pmtiles` with byte-range support. It
also provides `/maps/style.json`, built from every vector layer in the archive.
Restart the map server to select a different archive; reload the UI afterward.

The OpenStreetMap-like style shows land use, water, buildings, roads, paths,
railways, points, labels and addresses. Unfamiliar layers get fallback styles.
Click a feature to inspect its stored tags. MapLibre 6 renders text using local
fonts, so the map and labels work without an external basemap/font service.
Styling and label collision rules control visibility; they do not remove data
from the archive. Different third-party layer schemas may need a custom style
for their intended appearance.

The aircraft marker follows the `lat`/`lng` props. The map starts around that
position at zoom 17 and supports overzooming to 22.

Convert raw OSM or GeoTIFF data on the **personal laptop** using the Homebrew
tools documented in the [map server README](../../../maps/map-server/Readme.md).
Only the resulting `.pmtiles` file is needed on the work laptop. The conversion
scripts, preservation settings, feature audits and source backups stay in that
separate preparation workflow.

`npm run build` checks TypeScript and builds the UI. `npm run preview` also
proxies map requests, so leave the map server running when previewing.
`npm run lint` checks the lab source. In `maps/map-server`, `npm test` verifies
the server without any conversion tools installed.

## Aerial imagery

Raster PNG/JPEG/WebP PMTiles are also supported. For the converted Kāpiti Coast
2025 imagery, start the map server with `npm start -- kapiti-coast-2025`. It
automatically supplies a raster style, and the UI displays photographic colours.
Only the supplied imagery footprint is covered. The aircraft marker and zoom
controls work as before; OSM tag inspection applies to vector maps only.

See [GeoTIFF conversion instructions](../../../maps/map-server/GEOTIFF.md) for
single TIFFs and directories of imagery tiles.
