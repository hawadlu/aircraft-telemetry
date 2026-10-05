const express = require("express");
const path = require("path");
const fs = require("fs");
const { execFileSync } = require("child_process");
const { buildStyle } = require("./map-style");

const cors = require('cors');
const args = process.argv.slice(2);
const usage = "Usage: node server.js [map-name | file.pmtiles | path/to/file.pmtiles]";

if (args.length === 1 && ["--help", "-h"].includes(args[0])) {
    console.log(usage);
    process.exit(0);
}
if (args.length > 1 || args[0]?.startsWith("-")) {
    console.error(usage);
    process.exit(1);
}

const mapDataDirectory = path.join(__dirname, "..", "map-data");
const selectedMap = args[0] || "map.pmtiles";
const filename = path.extname(selectedMap) ? selectedMap : `${selectedMap}.pmtiles`;
// Bare names refer to map-data; explicit paths are relative to the caller.
const mapPath = path.dirname(filename) === "." && !filename.startsWith(".")
    ? path.join(mapDataDirectory, filename)
    : path.resolve(filename);

let metadata;
let header;
try {
    if (path.extname(mapPath).toLowerCase() !== ".pmtiles" || !fs.statSync(mapPath).isFile()) {
        throw new Error("Select a .pmtiles file");
    }
    fs.accessSync(mapPath, fs.constants.R_OK);
    // Use the official PMTiles reader, rather than assuming a layer schema or
    // treating an incorrectly named SQLite/MBTiles database as a PMTiles file.
    metadata = JSON.parse(execFileSync("pmtiles", ["show", mapPath, "--metadata"], {
        encoding: "utf8", maxBuffer: 16 * 1024 * 1024,
    }));
    header = JSON.parse(execFileSync("pmtiles", ["show", mapPath, "--header-json"], { encoding: "utf8" }));
    if (header.tile_type === "mvt" && (!Array.isArray(metadata.vector_layers) || metadata.vector_layers.length === 0)) {
        throw new Error("The map must contain vector layers");
    }
    if (!["mvt", "png", "jpg", "jpeg", "webp", "avif"].includes(header.tile_type)) {
        throw new Error(`Unsupported tile type: ${header.tile_type}`);
    }
} catch (error) {
    console.error(`Cannot use map ${mapPath}: ${error.message}`);
    if (error.code === "ENOENT" && error.path === "pmtiles") {
        console.error("Install the PMTiles reader: brew install pmtiles");
    }
    process.exit(1);
}

const app = express();
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    exposedHeaders: ["Content-Range", "Accept-Ranges", "ETag"],
}));

app.get("/maps/style.json", (req, res) => {
    res.set("Cache-Control", "no-store");
    const attribution = String(metadata.attribution || (header.tile_type === "mvt" ? "© OpenStreetMap contributors" : ""))
        .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
    const archiveUrl = `${req.protocol}://${req.get("host")}/maps/map.pmtiles`;
    if (header.tile_type !== "mvt") {
        res.json({
            version: 8, name: metadata.name || "Aerial imagery",
            sources: { local: { type: "raster", url: `pmtiles://${archiveUrl}`, tileSize: 256, attribution } },
            layers: [{ id: "imagery", type: "raster", source: "local", paint: { "raster-fade-duration": 0 } }],
        });
    } else {
        res.json(buildStyle(metadata.vector_layers.map((layer) => layer.id), archiveUrl, attribution));
    }
});

// Keep the client's URL stable when selecting a different archive.
app.get("/maps/map.pmtiles", (req, res, next) => {
    res.sendFile(mapPath, { cacheControl: false }, (error) => {
        if (error) next(error);
    });
});
// Preserve access to other archives by their actual filenames.
app.use("/maps", express.static(mapDataDirectory));

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Map server running on http://localhost:${port}`);
    console.log(`Serving ${mapPath} at /maps/map.pmtiles`);
}).on("error", (error) => {
    console.error(`Cannot start map server: ${error.message}`);
    process.exitCode = 1;
});
