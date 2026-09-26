import 'maplibre-gl/dist/maplibre-gl.css';
import {MapView} from "./Map.tsx";

export default function App() {

	return (
		<>
			<h1>App</h1>
			<MapView lat={-40.958023} lng={174.973093} />
		</>
	)
}