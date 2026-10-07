import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { Protocol } from "pmtiles";
import "maplibre-gl/dist/maplibre-gl.css";
import type {AircraftPosition} from "./types.ts";


const protocol = new Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);


export function MapView({ position }: { position: AircraftPosition | null }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const markerRef = useRef<maplibregl.Marker | null>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const trailRef = useRef<[number, number][]>([]);
    const latestPosition = useRef<[number, number] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [raster, setRaster] = useState(false);

    function updateTrail() {
        const source =
            mapRef.current?.getSource("trail") as maplibregl.GeoJSONSource | undefined;

        source?.setData({
            type: "Feature",
            properties: {},
            geometry: {
                type: "LineString",
                coordinates: trailRef.current,
            },
        });
    }

    function updateAircraft(map: maplibregl.Map, coordinates: [number, number]) {
        if (!markerRef.current) {
            const icon = document.createElement("img");
            icon.src = "./marker.svg";
            icon.alt = "Aircraft position";
            icon.style.width = "32px";
            icon.style.height = "32px";
            console.log("Heading: " + position?.heading)
            markerRef.current = new maplibregl.Marker({ element: icon })
                .setRotation(position?.heading)
                .setLngLat(coordinates).addTo(map);
        } else {
            markerRef.current.setLngLat(coordinates);
        }
        map.jumpTo({ center: coordinates });
    }

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const controller = new AbortController();
        let map: maplibregl.Map | undefined;
        let popup: maplibregl.Popup | undefined;

        async function initialize() {
            try {
                const response = await fetch("/maps/style.json", { signal: controller.signal });
                if (!response.ok) throw new Error(`Map style request failed (${response.status})`);
                const style: maplibregl.StyleSpecification = await response.json();
                if (controller.signal.aborted) return;
                // Use the browser origin so the same style works through Vite's
                // proxy and when the map server uses a different port or host.
                const source = style.sources.local;
                if (!source || (source.type !== "vector" && source.type !== "raster")) throw new Error("The map style has no supported source");
                setRaster(source.type === "raster");
                source.url = `pmtiles://${new URL("/maps/map.pmtiles", window.location.origin).href}`;
                map = new maplibregl.Map({
                    container: container!,
                    center: latestPosition.current ?? [174.973096, -40.957876],
                    zoom: 17,
                    maxZoom: 22,
                    style,
                });
                const currentMap = map;
                mapRef.current = currentMap;
                currentMap.on("error", (event) => {
                    console.error("Map error:", event.error);
                    setError(`Unable to render the selected map: ${event.error.message}`);
                });
                currentMap.on("idle", () => {
                    if (currentMap.isSourceLoaded("local")) setError(null);
                });
                currentMap.addControl(new maplibregl.NavigationControl());
                currentMap.addControl(new maplibregl.ScaleControl());

                currentMap.on("click", (event) => {
                    const features = currentMap.queryRenderedFeatures(event.point);
                    const content = document.createElement("div");
                    content.style.cssText = "max-height:320px;overflow:auto;font:12px sans-serif";
                    const seen = new Set<string>();
                    for (const feature of features) {
                        const key = `${feature.sourceLayer}:${feature.id ?? JSON.stringify(feature.properties)}`;
                        if (seen.has(key)) continue;
                        seen.add(key);
                        const details = document.createElement("details");
                        details.open = seen.size === 1;
                        const summary = document.createElement("summary");
                        summary.textContent = String(feature.properties.name ?? `${feature.sourceLayer} · ${feature.geometry.type}`);
                        details.append(summary);
                        const tags = document.createElement("pre");
                        tags.style.cssText = "white-space:pre-wrap;overflow-wrap:anywhere";
                        tags.textContent = JSON.stringify(feature.properties, null, 2);
                        details.append(tags);
                        content.append(details);
                    }
                    popup?.remove();
                    if (seen.size) {
                        popup = new maplibregl.Popup({ maxWidth: "420px" })
                            .setLngLat(event.lngLat).setDOMContent(content).addTo(currentMap);
                    }
                });

                currentMap.on("load", () => {
                    currentMap.addSource("trail", {
                        type: "geojson",
                        data: {
                            type: "Feature",
                            properties: {},
                            geometry: {
                                type: "LineString",
                                coordinates: trailRef.current,
                            },
                        },
                    });

                    currentMap.addLayer({
                        id: "trail",
                        type: "line",
                        source: "trail",
                        paint: {
                            "line-color": "#007aff",
                            "line-width": 3,
                        },
                    });
                });

                if (latestPosition.current) {
                    updateAircraft(currentMap, latestPosition.current);
                }
            } catch (cause) {
                if (!controller.signal.aborted) {
                    setError(cause instanceof Error ? cause.message : "Unable to load the map");
                }
            }
        }
        void initialize();
        return () => {
            controller.abort();
            popup?.remove();
            markerRef.current?.remove();
            markerRef.current = null;
            map?.remove();
            mapRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!position) return;
        const coordinates: [number, number] = [position.lng, position.lat];
        latestPosition.current = coordinates;
        const previous = trailRef.current.at(-1);
        if (!previous || previous[0] !== coordinates[0] || previous[1] !== coordinates[1]) {
            trailRef.current.push(coordinates);
        }

        if (mapRef.current) updateAircraft(mapRef.current, coordinates);
        updateTrail();
    }, [position]);

    return (
        <div style={{ position: "relative" }}>
            <div ref={containerRef} style={{ width: "100%", height: "80vh" }} />
            {error && <p role="alert" style={{ position: "absolute", top: 8, left: 8, right: 48, background: "white", padding: 12 }}>{error}</p>}
            <p>{raster ? "Aerial imagery. Zoom in to inspect ground detail." : "Click a feature to inspect its stored OSM tags. Labels and colours use an OpenStreetMap-like style."}</p>
        </div>
    );
}
