# Local map server

From this directory:

```sh
npm install
npm start
```

The server exposes `../maps/map-data/map.pmtiles` at
`http://localhost:3000/maps/map.pmtiles`, including HTTP byte-range requests.
The map UI in `learningLabs/06-map-ui/02` proxies `/maps` to this server.
