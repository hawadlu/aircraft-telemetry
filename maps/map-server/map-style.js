// OpenStreetMap-like presentation. OSM tags remain in the tiles; this module
// controls only their appearance. Unknown source layers receive fallback styles.
function buildStyle(layerIds, archiveUrl, attribution) {
    const layers = [{ id: "background", type: "background", paint: { "background-color": "#f2efe9" } }];
    const has = (key) => ["has", key];
    const get = (key) => ["get", key];
    const equal = (key, value) => ["==", get(key), value];
    const any = (...conditions) => ["any", ...conditions];
    const all = (...conditions) => ["all", ...conditions];
    const not = (condition) => ["!", condition];
    const geometry = (type) => ["==", ["geometry-type"], type];
    const named = any(has("name"), has("name:en"), has("ref"));
    const text = ["coalesce", get("name"), get("name:en"), get("ref"), ""];
    const font = ["Arial", "sans-serif"];
    const zoomWidth = (low, high) => ["interpolate", ["linear"], ["zoom"], 10, low, 18, high];
    const contexts = layerIds.map((id) => ({
        id,
        building: any(["literal", ["buildings", "building"].includes(id)],
            all(has("building"), not(equal("building", "no"))), has("building:part")),
        water: any(["literal", ["water", "water_polygons"].includes(id)],
            equal("natural", "water"), equal("natural", "bay"), has("water"),
            equal("waterway", "riverbank"), equal("waterway", "dock"),
            equal("landuse", "reservoir"), equal("landuse", "basin")),
        road: any(["literal", ["streets", "transportation", "roads"].includes(id)], has("highway")),
        river: any(["literal", ["water_lines", "waterway"].includes(id)], has("waterway")),
        rail: any(["literal", ["railways", "railway"].includes(id)], has("railway")),
    }));
    const add = (context, suffix, type, filter, paint, layout, minzoom) => {
        layers.push({ id: `${context.id}/${suffix}`, type, source: "local", "source-layer": context.id,
            filter, paint, ...(layout ? { layout } : {}), ...(minzoom == null ? {} : { minzoom }) });
    };
    const landColour = ["match", ["coalesce", get("landuse"), get("natural"), get("leisure"), ""],
        ["wood", "forest"], "#add19e", ["grass", "grassland", "meadow", "park", "garden", "recreation_ground"], "#cdebb0",
        ["scrub", "heath"], "#d5dfb5", ["farmland", "farmyard", "orchard", "vineyard"], "#e5e7bb",
        ["sand", "beach"], "#fff1ba", ["wetland", "marsh"], "#a9cfbf", "residential", "#ddd9d5",
        ["industrial", "commercial", "retail"], "#e8d8e4", "cemetery", "#aacbaf", "#e7e5df"];
    for (const c of contexts) {
        add(c, "land", "fill", all(geometry("Polygon"), not(c.water), not(c.building)),
            { "fill-color": landColour, "fill-outline-color": "#c8c9bf" });
    }
    for (const c of contexts) {
        add(c, "water", "fill", all(geometry("Polygon"), c.water), { "fill-color": "#aad3df" });
        add(c, "buildings", "fill", all(geometry("Polygon"), c.building), {
            "fill-color": ["to-color", ["coalesce", get("building:colour"), get("colour"), get("color"), "#d9d0c9"], "#d9d0c9"],
            "fill-outline-color": "#b5a99e",
        }, undefined, 13);
    }
    for (const c of contexts) {
        add(c, "other-lines", "line", all(geometry("LineString"), not(c.road), not(c.river), not(c.rail)), {
            "line-color": ["case", has("boundary"), "#9e79a2", equal("natural", "coastline"), "#6da7b8",
                has("barrier"), "#78786f", "#9b9a91"],
            "line-width": zoomWidth(0.5, 1.2),
        });
        add(c, "waterways", "line", all(geometry("LineString"), c.river), {
            "line-color": "#8fc5d5", "line-width": zoomWidth(0.7, 3),
        });
        add(c, "road-casing", "line", all(geometry("LineString"), c.road), {
            "line-color": "#b9a899", "line-width": zoomWidth(1, 7),
        }, { "line-join": "round", "line-cap": "round" });
        add(c, "roads", "line", all(geometry("LineString"), c.road), {
            "line-color": ["match", get("highway"), ["motorway", "motorway_link"], "#e892a2",
                ["trunk", "trunk_link"], "#f9b29c", ["primary", "primary_link"], "#fcd6a4",
                ["secondary", "secondary_link"], "#f7fabf", ["footway", "path", "track", "bridleway", "steps"], "#dfbd9b", "#ffffff"],
            "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.5, 18,
                ["match", get("highway"), ["footway", "path", "track", "bridleway", "steps"], 2, 5]],
        }, { "line-join": "round", "line-cap": "round" });
        add(c, "railways", "line", all(geometry("LineString"), c.rail), {
            "line-color": "#707070", "line-width": zoomWidth(0.7, 2), "line-dasharray": [3, 2],
        });
    }
    for (const c of contexts) {
        // Include even untagged nodes at close zoom; tagged POIs receive larger markers.
        add(c, "points", "circle", geometry("Point"), {
            "circle-radius": ["case", any(named, has("amenity"), has("shop"), has("tourism")), 3, 1],
            "circle-color": ["case", equal("natural", "tree"), "#649b52", has("amenity"), "#9464a0", "#647e86"],
            "circle-opacity": ["step", ["zoom"], 0.6, 19, 0.9],
        }, undefined, 16);
        add(c, "line-labels", "symbol", all(geometry("LineString"), named),
            { "text-color": "#57534e", "text-halo-color": "#ffffff", "text-halo-width": 1.5 },
            { "symbol-placement": "line", "text-field": text, "text-font": font, "text-size": 11 }, 13);
        add(c, "labels", "symbol", all(not(geometry("LineString")), named),
            { "text-color": "#46443f", "text-halo-color": "#ffffff", "text-halo-width": 1.5 },
            { "text-field": text, "text-font": font, "text-size": 12, "text-offset": [0, 0.8], "text-anchor": "top" }, 13);
        add(c, "addresses", "symbol", all(geometry("Polygon"), has("addr:housenumber"), not(named)),
            { "text-color": "#70665e", "text-halo-color": "#ffffff", "text-halo-width": 1 },
            { "text-field": ["to-string", get("addr:housenumber")], "text-font": font, "text-size": 10 }, 18);
    }
    return {
        version: 8, name: "Detailed OSM", metadata: { "local:source-layers": layerIds },
        // MapLibre 6 uses local fonts when glyphs is omitted, including offline.
        sources: { local: { type: "vector", url: `pmtiles://${archiveUrl}`, attribution } },
        layers,
    };
}

module.exports = { buildStyle };
