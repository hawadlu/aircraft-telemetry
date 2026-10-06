const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const { mkdtemp, writeFile, rm } = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { gzipSync } = require("node:zlib");
const { test } = require("node:test");
const { PMTiles } = require("pmtiles");

// A tiny v3 archive with one z0 tile. Build fixtures using Node only, without
// invoking conversion tools or relying on the user's multi-gigabyte maps.
function fixture(tileType, metadata, compressed = true) {
    const tile = tileType === 1 ? Buffer.from([0x1a, 5, 0x0a, 1, 0x78, 0x78, 2])
        : Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64");
    const encode = (buffer) => compressed ? gzipSync(buffer) : buffer;
    const root = encode(Buffer.from([1, 0, 1, tile.length, 1]));
    const json = encode(Buffer.from(JSON.stringify(metadata)));
    const header = Buffer.alloc(127);
    header.write("PMTiles");
    header[7] = 3;
    const integer = (offset, value) => header.writeBigUInt64LE(BigInt(value), offset);
    integer(8, 127);
    integer(16, root.length);
    integer(24, 127 + root.length);
    integer(32, json.length);
    integer(40, 127 + root.length + json.length);
    integer(48, 0);
    integer(56, 127 + root.length + json.length);
    integer(64, tile.length);
    for (const offset of [72, 80, 88]) integer(offset, 1);
    header[96] = 1;
    header[97] = compressed ? 2 : 1;
    header[98] = 1;
    header[99] = tileType;
    return Buffer.concat([header, root, json, tile]);
}

async function launch(t, bytes, extension = ".pmtiles") {
    const directory = await mkdtemp(path.join(os.tmpdir(), "map-server-test-"));
    t.after(() => rm(directory, { recursive: true, force: true }));
    const filename = path.join(directory, `test map${extension}`);
    await writeFile(filename, bytes);
    const child = spawn(process.execPath, [path.join(__dirname, "server.js"), filename], {
        cwd: directory,
        // Even a machine with Homebrew cannot find a conversion executable.
        env: { ...process.env, PATH: "", PORT: "0" },
        stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.stderr.on("data", (chunk) => { output += chunk; });
    const exited = once(child, "exit");
    t.after(async () => {
        if (child.exitCode === null && child.signalCode === null) child.kill();
        await exited;
    });
    const url = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error(`Server startup timed out: ${output}`)), 10000);
        const settle = (value) => { clearTimeout(timeout); resolve(value); };
        child.stdout.on("data", () => {
            const match = output.match(/Map server running on (http:\/\/localhost:\d+)/);
            if (match) settle(match[1]);
        });
        child.once("exit", () => settle(null));
        child.once("error", (error) => { clearTimeout(timeout); reject(error); });
    });
    return { url, exited, output: () => output };
}

for (const compressed of [false, true]) {
    test(`vector serving without CLI tools (gzip=${compressed})`, async (t) => {
        const bytes = fixture(1, { vector_layers: [{ id: "osm" }, { id: "custom" }] }, compressed);
        const server = await launch(t, bytes);
        assert.ok(server.url, server.output());
        const response = await fetch(`${server.url}/maps/style.json`);
        assert.equal(response.status, 200);
        const style = await response.json();
        assert.equal(style.sources.local.type, "vector");
        assert.deepEqual(style.metadata["local:source-layers"], ["osm", "custom"]);
        assert.equal(style.glyphs, undefined);
        for (const layer of ["osm", "custom"]) {
            assert.ok(style.layers.some((item) => item["source-layer"] === layer));
        }
        const url = style.sources.local.url.replace(/^pmtiles:\/\//, "");
        const range = await fetch(url, { headers: { Range: "bytes=0-126", Origin: "http://localhost:5173" } });
        assert.equal(range.status, 206);
        assert.equal(range.headers.get("content-range"), `bytes 0-126/${bytes.length}`);
        assert.equal(range.headers.get("access-control-allow-origin"), "http://localhost:5173");
        assert.ok(range.headers.get("access-control-expose-headers").includes("Content-Range"));
        assert.deepEqual(Buffer.from(await range.arrayBuffer()), bytes.subarray(0, 127));
        // Exercise the same HTTP reader used by the lab, including tile lookup.
        const archive = new PMTiles(url);
        assert.deepEqual(await archive.getMetadata(), { vector_layers: [{ id: "osm" }, { id: "custom" }] });
        assert.ok((await archive.getZxy(0, 0, 0)).data.byteLength > 0);
    });
}

for (const tileType of [2, 3, 4, 5]) {
    test(`raster style for tile type ${tileType} without CLI tools`, async (t) => {
        const server = await launch(t, fixture(tileType, { name: "Imagery", attribution: "A & <B>" }));
        assert.ok(server.url, server.output());
        const style = await (await fetch(`${server.url}/maps/style.json`)).json();
        assert.equal(style.name, "Imagery");
        assert.equal(style.sources.local.type, "raster");
        assert.equal(style.sources.local.attribution, "A &amp; &lt;B&gt;");
        assert.equal(style.layers[0].type, "raster");
    });
}

const truncated = fixture(2, {}).subarray(0, -1);
const badVersion = fixture(2, {});
badVersion[7] = 4;
for (const [name, bytes, message] of [
    ["renamed SQLite", Buffer.from("SQLite format 3\0"), /valid PMTiles v3/],
    ["unsupported version", badVersion, /valid PMTiles v3/],
    ["truncated archive", truncated, /Truncated or invalid/],
    ["unsupported tile type", fixture(0, {}), /Unsupported tile type/],
    ["missing vector layers", fixture(1, {}), /must contain vector layers/],
    ["invalid layer ID", fixture(1, { vector_layers: [null] }), /must contain vector layers/],
    ["invalid metadata", fixture(2, null), /metadata object/],
]) {
    test(`rejects ${name} before listening`, async (t) => {
        const server = await launch(t, bytes);
        assert.equal(server.url, null);
        assert.equal((await server.exited)[0], 1);
        assert.match(server.output(), message);
        assert.doesNotMatch(server.output(), /brew install/);
    });
}
