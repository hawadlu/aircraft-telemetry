import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { Protocol } from "pmtiles";
import "maplibre-gl/dist/maplibre-gl.css";
// NOTE: CODEX WAS USED TO GET THE FIRST IMPLEMENTATION OF THIS WORKING.
// Register once, including when React StrictMode remounts the map.
const protocol = new Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

type Props = { lat: number; lng: number };

export function MapView({ lat, lng }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const markerRef = useRef<maplibregl.Marker | null>(null);
    const initialCenter = useRef<[number, number]>([lng, lat]);
    const [error, setError] = useState<string | null>(null);
    const [position, setPosition] = useState<{lat: number, lon: number}>({lat: lat, lon: lng})

    useEffect(() => {
        if (!containerRef.current) return;
        const archiveUrl = new URL("/maps/map.pmtiles", window.location.origin).href;
        const map = new maplibregl.Map({
            container: containerRef.current,
            center: initialCenter.current,
            zoom: 17,
            style: {
                version: 8,
                sources: {
                    local: { type: "vector", url: `pmtiles://${archiveUrl}` },
                },
                // These source-layer names come from this archive's metadata.
                layers: [
                    { id: "background", type: "background", paint: { "background-color": "#b9ddeb" } },
                    // "boundaries" contains island polygons; "land" only contains land-cover patches.
                    { id: "land-base", type: "fill", source: "local", "source-layer": "boundaries", paint: { "fill-color": "#e6e8d7" } },
                    { id: "land", type: "fill", source: "local", "source-layer": "land", paint: { "fill-color": "#e6e8d7" } },
                    { id: "water", type: "fill", source: "local", "source-layer": "water_polygons", paint: { "fill-color": "#b9ddeb" } },
                    { id: "rivers", type: "line", source: "local", "source-layer": "water_lines", paint: { "line-color": "#8bbfd5", "line-width": 1 } },
                    { id: "buildings", type: "fill", source: "local", "source-layer": "buildings", minzoom: 13, paint: { "fill-color": "#c4bdb3" } },
                    { id: "road-areas", type: "fill", source: "local", "source-layer": "street_polygons", paint: { "fill-color": "#ffffff" } },
                    { id: "roads", type: "line", source: "local", "source-layer": "streets", paint: { "line-color": "#ffffff", "line-width": ["interpolate", ["linear"], ["zoom"], 5, 0.5, 15, 3] } },
                ],
            },
        });
        map.on("error", (event) => {
            console.error("Map error:", event.error);
            setError("Unable to load the local map. Check that the map server is running on port 3000.");
        });
        map.on("idle", () => {
            if (map.isSourceLoaded("local")) setError(null);
        });
        map.addControl(new maplibregl.NavigationControl());
        const el = document.createElement("img");
        el.src = "./marker.svg";
        el.alt = "Aircraft position";
        el.style.width = "32px";
        el.style.height = "32px";
        markerRef.current = new maplibregl.Marker({ element: el })
            .setLngLat(initialCenter.current)
            .addTo(map);
        return () => {
            map.remove();
            markerRef.current = null;
        };
    }, []);

    // Run the map updates
    useEffect(() => {
        const newLon = position.lon;
        const newLat = position.lat + 0.000000001;
        markerRef.current?.setLngLat([newLon, newLat])

        // This is generally a bad idea for full size projects and would usually be driven by an external component
        setPosition({lat: newLat, lon: newLon})
    }, [position.lat, position.lon]);

    useEffect(() => {
        markerRef.current?.setLngLat([lng, lat]);

        // Note, This location would come from the server in the real project
        const intervalId = setInterval(() => {
            console.log(markerRef.current?.getLngLat().lng);
        }, 10000);

        return () => {
            clearInterval(intervalId)
        }

    }, [lat, lng]);

    return (
        <div style={{ position: "relative" }}>
            <div ref={containerRef} style={{ width: "100%", height: "80vh" }} />
            {error && <p role="alert" style={{ position: "absolute", top: 8, left: 8, right: 48, background: "white", padding: 12 }}>{error}</p>}
        </div>
    );
}
