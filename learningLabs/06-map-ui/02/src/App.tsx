import 'maplibre-gl/dist/maplibre-gl.css';
import {MapView} from "./Map.tsx";
import {useEffect, useReducer, useState} from "react";
import {HubConnection} from "@microsoft/signalr";
import * as signalR from '@microsoft/signalr';
import {initialState, stateReducer} from "./reducer.ts";
import {Action, type AircraftPosition, type Telemetry, Status} from "./types.ts";
import Timer from "./Timer.tsx";
import TelemetryCards from "./TelemetryCards.tsx";


export default function App() {
	// No aircraft marker until valid coordinates arrive.
	const [position, setPosition] = useState<AircraftPosition | null>(null);

	const [telemetry, setTelemetry] = useState<Telemetry | null>(null);

	const [state, dispatch] = useReducer(stateReducer, initialState);

	useEffect(() => {
        let disposed = false;
		// Configure connection
		const connection = new signalR.HubConnectionBuilder()
			.withUrl('http://localhost:5002/events') // Your Hub URL
			.withAutomaticReconnect()
			.build();

		async function startSignalR(retryCount = 0): Promise<HubConnection | undefined> {
            if (disposed) return undefined;
			const maxRetries = 5;
			// Calculate exponential delay (2s, 4s, 8s, 16s...) up to a max of 30 seconds
			const delay = 5000;
			console.log("Connected failed. Retrying")

			try {
				console.log("Entry try block")
				await connection.start()
                if (disposed) return undefined;
				dispatch({type: Action.SET_STATUS, status: Status.CONNECTED})
				return connection;
			} catch (err) {
                if (disposed) return undefined;
				console.log(err)
				if (retryCount < maxRetries) {
					dispatch({type: Action.SET_STATUS, status: Status.RETRY})
					console.log(`🔄 Retrying initial connection in ${delay / 1000}s...`);
					await new Promise(resolve => setTimeout(resolve, delay))
					return startSignalR(retryCount + 1)
				}

				dispatch({type: Action.SET_STATUS, status: Status.MAX_CONNECTIONS})
				return undefined;
			}
		}

		connection.on('MessagePublished', (data) => {
			const formattedJson = typeof data === 'object'
				? JSON.stringify(data, null, 2)
				: data;

            try {
                const telemetry = JSON.parse(data.text);
                const readNumber = (camel: string, pascal: string): number | null => {
                    const value = telemetry?.[camel] ?? telemetry?.[pascal];
                    return typeof value === "number" && Number.isFinite(value) ? value : null;
                };
                if (telemetry && typeof telemetry === "object") {
                    setTelemetry({
                        altitudeMetres: readNumber("altitudeMetres", "AltitudeMetres"),
                        headingDegrees: readNumber("headingDegrees", "HeadingDegrees"),
                        groundSpeedKmh: readNumber("groundSpeedKmh", "GroundSpeedKmh"),
                        batteryVolts: readNumber("batteryVolts", "BatteryVolts"),
                        lat: readNumber("lat", "Lat"),
                        lon: readNumber("lon", "Lon"),
                    });
                }
                const lat = telemetry?.lat ?? telemetry?.Lat;
                const lng = telemetry?.lon ?? telemetry?.Lon;
	            const heading = telemetry?.headingDegrees ?? telemetry?.HeadingDegrees;
                if (typeof lat === "number" && Number.isFinite(lat) && Math.abs(lat) <= 90 &&
                    typeof lng === "number" && Number.isFinite(lng) && Math.abs(lng) <= 180) {
                    setPosition(previous => ({
                        lat,
                        lng,
                        heading: typeof heading === "number" && Number.isFinite(heading)
                            ? ((heading % 360) + 360) % 360
                            : previous?.heading ?? 0,
                    }));
                }
            } catch (error) {
                console.warn("Ignoring invalid coordinate payload", error);
            }

			dispatch({type: Action.ADD_MESSAGE, message: formattedJson})
		});

		// Reconnect behaviour
		connection.onreconnecting(() => dispatch({type: Action.SET_STATUS, status: Status.RECONNECTING}))
		connection.onreconnected(() => dispatch({type: Action.SET_STATUS, status: Status.CONNECTED}))
		connection.onclose(() => {
            if (!disposed) dispatch({type: Action.SET_STATUS, status: Status.CONNECTION_CLOSED});
        })

		// Start connection
		startSignalR(0).then(() => {
			console.log("Connection started")
		})

		return () => {
            disposed = true;
            connection.off("MessagePublished");
            void connection.stop();
		};
	}, []);

	return (
		<>
			<MapView position={position}/>
			<div style={{padding: '20px', fontFamily: 'monospace', width: '100%', boxSizing: 'border-box'}}>
				<TelemetryCards telemetry={telemetry} status={state.status} />

				<h2>SignalR JSON Feed</h2>

				{/* Status Bar */}
				<div style={{
					padding: '10px',
					borderRadius: '4px',
					backgroundColor: state.status.includes(Status.CONNECTED) ? '#e6fffa' : '#fff5f5',
					color: state.status.includes(Status.CONNECTED) ? '#234e52' : '#9b2c2c',
					marginBottom: '15px'
				}}>
					<strong>Status:</strong> {state.status}
					<Timer lastReceivedDate={state.lastReceivedDate}/>
				</div>


				{/* Control Button */}
				{state.messages.length > 0 && (
					<button
						onClick={() => dispatch({type: Action.CLEAR_FEED})}
						style={{padding: '8px 12px', cursor: 'pointer', marginBottom: '15px'}}
					>
						Clear Feed
					</button>
				)}

				{/* JSON Logs */}
				<div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
					{state.messages.length === 0 ? (
						<p style={{color: '#666'}}>Waiting for JSON payloads...</p>
					) : (
						state.messages.map((msg, index) => (
							<pre
								key={index}
								style={{
									backgroundColor: '#f7fafc',
									padding: '15px',
									borderRadius: '5px',
									border: '1px solid #e2e8f0',
									overflowX: 'auto',
									margin: 0
								}}
							>
              {msg}
            </pre>
						))
					)}
				</div>
			</div>
		</>
	)
}