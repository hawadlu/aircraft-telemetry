// MapView.tsx

import { useEffect, useRef } from "react";
import * as maplibregl from 'maplibre-gl';
import "maplibre-gl/dist/maplibre-gl.css";

type Props = {
	lat: number;
	lng: number;
};

export function MapView({ lat, lng }: Props) {
	const mapRef = useRef<maplibregl.Map | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const markerRef = useRef<maplibregl.Marker | null>(null);

	useEffect(() => {
		if (!containerRef.current) return;

		const map = new maplibregl.Map({
			container: containerRef.current!,
			style: "https://demotiles.maplibre.org/style.json",
			center: [lng, lat],
			zoom: 5,
		});

		mapRef.current = map;

		const el = document.createElement("img")
		el.src = "./marker.svg";
		markerRef.current = new maplibregl.Marker({element: el})
			.setLngLat([lng, lat])
			.addTo(map);

		return () => map.remove();
	}, []);

	useEffect(() => {
		markerRef.current?.setLngLat([lng, lat]);
	}, [lat, lng]);

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