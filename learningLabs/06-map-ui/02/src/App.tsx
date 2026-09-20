import {MapView} from "./Map.tsx";

export default function App() {
	const lat: number = -40.958023;
	const lng: number = 174.973093;

	return (
		<>
			<h1>App</h1>
			<MapView lat={lat} lng={lng}/>
		</>
	)
}