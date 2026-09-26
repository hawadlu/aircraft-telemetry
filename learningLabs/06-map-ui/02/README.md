# Local PMTiles map

From the repository root, start the map server:

```sh
cd map-server
npm install
npm start
```

In a second terminal, from the repository root:

```sh
cd learningLabs/06-map-ui/02
npm install
npm run dev
```

Open the URL printed by Vite. `/maps/map.pmtiles` is proxied to port 3000,
where Express serves `maps/map-data/map.pmtiles` with HTTP byte-range support.
The PMTiles protocol reads vector tiles and MapLibre draws the archive's land,
water, streets, buildings, and boundaries. No remote basemap is required.
This minimal style does not include text labels or external fonts.

`npm run build` checks TypeScript and builds the UI. `npm run preview` also
proxies map requests, so leave the map server running when previewing.
