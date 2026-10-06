const { open } = require("node:fs/promises");
const { PMTiles, TileType } = require("pmtiles");

// The npm reader accepts a byte-range Source. Read only the header, root
// directory and metadata at startup, even for multi-gigabyte local archives.
async function readArchive(mapPath) {
    const file = await open(mapPath, "r");
    try {
        const { size } = await file.stat();
        const source = {
            getKey: () => mapPath,
            async getBytes(offset, length) {
                if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length)
                    || offset < 0 || length < 0 || offset > size) {
                    throw new Error("Invalid PMTiles byte range");
                }
                // The reader initially requests 16 KiB, including for tiny files.
                const data = new Uint8Array(Math.min(length, size - offset));
                let read = 0;
                while (read < data.length) {
                    const { bytesRead } = await file.read(data, read, data.length - read, offset + read);
                    if (!bytesRead) throw new Error("Unexpected end of PMTiles archive");
                    read += bytesRead;
                }
                return { data: data.buffer };
            },
        };
        const { data } = await source.getBytes(0, 127);
        const signature = Buffer.from(data);
        if (signature.length !== 127 || signature.toString("ascii", 0, 7) !== "PMTiles" || signature[7] !== 3) {
            throw new Error("Select a valid PMTiles v3 archive (not an MBTiles database)");
        }
        const archive = new PMTiles(source);
        const header = await archive.getHeader();
        for (const section of ["rootDirectory", "jsonMetadata", "leafDirectory", "tileData"]) {
            const offset = header[`${section}Offset`];
            const length = header[`${section}Length`];
            if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length)
                || offset < 0 || length < 0 || offset > size || length > size - offset) {
                throw new Error(`Truncated or invalid PMTiles ${section}`);
            }
        }
        if (![TileType.Mvt, TileType.Png, TileType.Jpeg, TileType.Webp, TileType.Avif].includes(header.tileType)) {
            throw new Error(`Unsupported tile type: ${header.tileType}`);
        }
        const metadata = await archive.getMetadata();
        if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
            throw new Error("The map must contain a metadata object");
        }
        if (header.tileType === TileType.Mvt && (!Array.isArray(metadata.vector_layers)
            || metadata.vector_layers.length === 0
            || metadata.vector_layers.some((layer) => !layer || typeof layer.id !== "string" || !layer.id))) {
            throw new Error("The map must contain vector layers with nonempty IDs");
        }
        return { header, metadata };
    } finally {
        await file.close();
    }
}

module.exports = { readArchive };
