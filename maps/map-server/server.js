const express = require("express");
const path = require("path");
const fs = require("fs");
const { TileType } = require("pmtiles");
const { readArchive } = require("./read-archive");
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

async function start() {
    let metadata;
    let header;
    try {
        if (path.extname(mapPath).toLowerCase() !== ".pmtiles" || !fs.statSync(mapPath).isFile()) {
            throw new Error("Select a .pmtiles file");
        }
        ({ metadata, header } = await readArchive(mapPath));
    } catch (error) {
        console.error(`Cannot use map ${mapPath}: ${error.message}`);
        process.exitCode = 1;
        return;
    }

    const app = express();
    app.use(cors({
        origin: ["http://localhost:5173", "http://localhost:5174"],
        exposedHeaders: ["Content-Range", "Accept-Ranges", "ETag"],
    }));

    app.get("/maps/style.json", (req, res) => {
        res.set("Cache-Control", "no-store");
        const attribution = String(metadata.attribution || (header.tileType === TileType.Mvt ? "© OpenStreetMap contributors" : ""))
            .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
        const archiveUrl = `${req.protocol}://${req.get("host")}/maps/map.pmtiles`;
        if (header.tileType !== TileType.Mvt) {
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
    const server = app.listen(port).on("listening", () => {
        console.log(`Map server running on http://localhost:${server.address().port}`);
        console.log(`Serving ${mapPath} at /maps/map.pmtiles`);
    }).on("error", (error) => {
        console.error(`Cannot start map server: ${error.message}`);
        process.exitCode = 1;
    });
}

start().catch((error) => {
    console.error(`Cannot start map server: ${error.message}`);
    process.exitCode = 1;
});
