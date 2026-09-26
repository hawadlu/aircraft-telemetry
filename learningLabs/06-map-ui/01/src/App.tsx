// MapView.tsx

// import { useEffect, useRef } from "react";
// import maplibregl from "maplibre-gl";
// import "maplibre-gl/dist/maplibre-gl.css";
//
// type Props = {
//   lat: number;
//   lng: number;
// };

import {MapView} from "./Map.tsx";

export default function App() {
  // 40.958023, 174.973093

    const lat: number = -40.958023;
    const lng: number = 174.973093;

  return (
      <>
        <h1>App</h1>
        <MapView lat={lat} lng={lng} />
      </>
  )
}