// MapView.tsx

import { useEffect, useRef } from "react";
import * as maplibregl from 'maplibre-gl';
import "maplibre-gl/dist/maplibre-gl.css";
import {PMTiles, Protocol} from "pmtiles";


export function MapView() {
	const mapRef = useRef<maplibregl.Map | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	// const markerRef = useRef<maplibregl.Marker | null>(null);

	useEffect(() => {
		async function initMap() {
			if (!containerRef.current) return;

			// Setup PMTiles protocol
			const protocol = new Protocol();
			maplibregl.addProtocol('pmtiles', protocol.tile);

			const tilesUrl = '/maps/map.pmtiles';
			const tiles = new PMTiles(tilesUrl);
			protocol.add(tiles);

			const metadata = await tiles.getMetadata();

			const header = await tiles.getHeader();
			console.log("Header: " + JSON.stringify(header));
			console.log("Layers: " + metadata.vector_layers.map(l => l.id));

			const map = new maplibregl.Map({
				container: containerRef.current!,
				style: {
					version: 8,
					sources: {
						"pmtiles-source": {
							type: "vector",
							url: `pmtiles://${tilesUrl}`,
						},
					},
					layers: [],
				},
				center: [-161.01013, -10.45],
				zoom: 10,
			});

			map.on("load", () => {
				metadata.vector_layers.forEach(layer => {
					map.addLayer({
						id: layer.id,
						source: "pmtiles-source",
						"source-layer": layer.id,
						type: "fill"
					});
				});

				console.log("Centre: " + map.getCenter());
				console.log("Zoom: " + map.getZoom());
			})

			map.on("idle", () => {
				console.log(
					map.queryRenderedFeatures()
				);
			});

			mapRef.current = map;

		}

		initMap().then(r => console.log("Initiated map"))

		// map.on('load', () => {
		// 	map.addSource("topo", {
		// 		type: "vector",
		// 		url: "pmtiles://http://localhost:3000/maps/map.pmtiles",
		// 	});
		// })

		// markerRef.current = new maplibregl.Marker()
		// 	.setLngLat([lng, lat])
		// 	.addTo(map);

		// return () => map.remove();
	}, []);

	useEffect(() => {
		// markerRef.current?.setLngLat([lng, lat]);
	}, []);

	return (
		<div
			ref={containerRef}
			style={{
				width: "100%",
				height: "100vh",
			}}
		/>
	);
}