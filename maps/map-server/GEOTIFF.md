# GeoTIFF imagery to PMTiles

Conversion runs on the **personal laptop only**. The Python wrapper invokes
Homebrew's **GDAL** and **PMTiles** command-line tools.
It accepts a single GeoTIFF or a directory of `.tif`/`.tiff` files (including
subdirectories). Python uses only its standard library; no pip packages are needed.

The work laptop only needs Node/npm and the converted `.pmtiles` file to serve
and view maps. It does not need Homebrew, GDAL, Python or the PMTiles CLI.
See [viewer setup](Readme.md#view-maps-on-the-work-laptop-nodenpm-only).

```sh
brew install gdal pmtiles
```

From `maps/map-server`, convert the supplied Kāpiti dataset:

```sh
python3 convert-geotiff.py \
  lds-kapiti-coast-0075m-urban-aerial-photos-2025-GTiff \
  ../map-data/kapiti-coast-2025.pmtiles \
  --attribution 'Kapiti Coast District Council; Aerial Surveys; LINZ Data Service — CC BY 4.0'

```

After conversion, copy `kapiti-coast-2025.pmtiles` into `maps/map-data` on the work
laptop. From `maps/map-server`, run `npm install` and then
`npm start -- kapiti-coast-2025`. Start lab `06-map-ui/02` as described in its README.

For a single large TIFF:

```sh
python3 convert-geotiff.py /path/to/imagery.tif ../map-data/imagery.pmtiles
```

Add `--force` to replace an existing archive after successful validation. Restart
the map server and reload the UI after switching archives. The server detects
raster versus vector PMTiles; the UI supports both. Imagery is displayed with
its photographic colours rather than the vector map's thematic styling.

## Supplied Kāpiti Coast imagery

The directory contains **28 GeoTIFF tiles, approximately 2.71 GiB**. The supplied
LINZ metadata identifies 2025 RGB aerial photography at **0.075 m ground pixel
resolution**, in NZTM2000 / EPSG:2193. This download is a clipped portion of the
larger survey, not coverage of the entire Kāpiti Coast. The PDF and text metadata
are not image tiles and are not included in the mosaic.

The converter selects **zoom 21** for this dataset. The target Web Mercator
pixel spacing is about 0.07465 projected metres, or about 0.056 m on the ground
at this latitude. This rounds up to avoid choosing a tile resolution coarser than
the supplied imagery; it does not create additional survey detail or improve its
positional accuracy. GDAL uses a virtual mosaic, not a huge merged TIFF.

## Detail, memory and disk

- Default **PNG** encoding is lossless and supports transparency. Reprojection
  and cubic resampling still change pixel values; the original TIFFs are unchanged.
- Max zoom is derived from GDAL's projected source resolution, rounded **up**.
  `--maxzoom N` overrides it; the script warns when this downsamples the source.
- `--minzoom` defaults to 0. Average-resampled overviews support zooming out.
  Extremely small image footprints can become fully transparent at low zooms;
  empty tiles are omitted and actual zoom counts are recorded in the report.
- GDAL reads blocks from disk. Defaults are a **512 MB cache**, **256 MB warp
  buffer**, and **2 threads**. These control GDAL working buffers, not a hard
  limit on the total process memory of all drivers and PMTiles conversion.
- Temporary MBTiles, partial tiles and the final archive need extra disk space.
  The script checks a conservative estimate based on projected pixel dimensions,
  rather than assuming that a 5 GB compressed TIFF needs only 5 GB of scratch space.
- Use `--work-dir /Volumes/FastDisk/scratch` for the large intermediate files.
  The final archive is staged on the output filesystem for atomic replacement.
  For the supplied dataset the initial conservative estimate is roughly **43 GiB**
  total if both locations share a filesystem; actual compressed sizes vary.
- `--skip-space-check` bypasses that estimate only. It cannot prevent running out
  of disk. Failed/interrupted conversion leaves an existing archive intact, saves
  diagnostics, and cleans intermediate files.

Example with an external scratch volume:

```sh
python3 convert-geotiff.py /path/to/imagery.tif ../map-data/imagery.pmtiles \
  --work-dir /Volumes/FastDisk/scratch --cache-mb 1024 --warp-memory-mb 512 --threads 4
```

Optional lossy encodings for smaller files:

```sh
python3 convert-geotiff.py /path/to/imagery.tif ../map-data/imagery.pmtiles \
  --format webp --quality 95
```

JPEG is also supported but discards transparency. PNG is the default for fidelity.

## Input checks

Byte RGB, RGBA, grayscale, grayscale+alpha and palette imagery are supported.
Ambiguous or multispectral layouts require explicit display bands, for example
`--bands 1 2 3`. Non-Byte imagery requires an explicit `--scale MIN MAX`; this maps
colour values into the 8-bit display range and is not lossless. The converter does
not silently clip 16-bit data. High-bit-depth alpha needs separate preparation.
Elevation models require a terrain-specific pipeline; this script is for imagery.

Input must have georeferencing and a CRS. `--source-srs EPSG:2193` can explicitly
supply/override a known source CRS. Directory mosaics use `gdalbuildvrt -strict`
so incompatible tiles fail instead of being silently omitted. Inputs are sorted
by path; later files take precedence where image footprints overlap.

## Outputs and checks

`name.pmtiles` is accompanied by:

- `name.raster-conversion.json`: input file manifest, source sizes, zooms, per-zoom
  tile counts, encoding, resolution, tool versions, settings and exact commands.
- `name.raster-conversion.log`: tool output and progress.

The script checks nonempty highest-zoom imagery, runs `pmtiles verify`, confirms
the raster tile type, and extracts/decodes a highest-zoom image tile with GDAL.
On failure it writes `name.raster-failed.log` rather than replacing a good map.

```sh
python3 test_geotiff.py
pmtiles show ../map-data/kapiti-coast-2025.pmtiles --header-json
pmtiles verify ../map-data/kapiti-coast-2025.pmtiles
```

## Underlying tools

The wrapper uses this sequence:

1. `gdalinfo -json` inspects source metadata.
2. `gdalbuildvrt -strict -resolution highest -addalpha` mosaics a directory virtually.
3. `gdal_translate -of VRT` selects display bands or applies explicitly requested scaling.
4. `gdalwarp -of VRT -t_srs EPSG:3857` estimates the projected resolution without writing pixels.
5. `gdalwarp -of MBTiles -t_srs EPSG:3857 -tr RES RES -tap -dstalpha -ovr NONE -et 0`
   writes the highest zoom directly to MBTiles, using PNG and cubic resampling by default.
6. `gdaladdo -r average` builds lower zoom levels.
7. `pmtiles convert imagery.mbtiles output.pmtiles --tmpdir=SCRATCH` packages the archive.
8. `pmtiles verify`, `pmtiles tile` and `gdalinfo` validate the result.

`RES` is `40075016.68557849 / (256 × 2^maxzoom)`. Exact runnable arguments are
printed as conversion runs and recorded in the JSON report. The installed GDAL
PMTiles driver is vector-only, so the raster pipeline deliberately uses MBTiles
as an intermediate format.

References: [GDAL raster MBTiles](https://gdal.org/en/stable/drivers/raster/mbtiles.html),
[GDAL BuildVRT](https://gdal.org/en/stable/programs/gdalbuildvrt.html),
[PMTiles CLI](https://docs.protomaps.com/pmtiles/cli).
