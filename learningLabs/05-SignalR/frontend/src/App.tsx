import {useEffect, useReducer, useState} from 'react';
import * as signalR from '@microsoft/signalr';
import {HubConnection} from "@microsoft/signalr";
import {initialState, stateReducer} from "./reducer.ts";
import {Action, Status} from "./types.ts";
import Timer from "./Timer.tsx";

export default function App() {

	const [state, dispatch] = useReducer(stateReducer, initialState);

	useEffect(() => {
		// Configure connection
		const connection = new signalR.HubConnectionBuilder()
			.withUrl('http://localhost:5002/events') // Your Hub URL
			.withAutomaticReconnect()
			.build();

		async function startSignalR(retryCount = 0): Promise<HubConnection | undefined> {
			const maxRetries = 5;
			// Calculate exponential delay (2s, 4s, 8s, 16s...) up to a max of 30 seconds
			const delay = 5000;
			console.log("Connected failed. Retrying")

			try {
				console.log("Entry try block")
				await connection.start()
				dispatch({type: Action.SET_STATUS, status: Status.CONNECTED})
				return connection;
			} catch (err) {
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

			dispatch({type: Action.ADD_MESSAGE, message: formattedJson})
		});

		// Reconnect behaviour
		connection.onreconnecting(() => dispatch({type: Action.SET_STATUS, status: Status.RECONNECTING}))
		connection.onreconnected(() => dispatch({type: Action.SET_STATUS, status: Status.CONNECTED}))
		connection.onclose(() => dispatch({type: Action.SET_STATUS, status: Status.CONNECTION_CLOSED}))

		// Start connection
		startSignalR(0).then(() => {
			console.log("Connection started")
		})

		return () => {
			connection.stop().then(() => dispatch({type: Action.SET_STATUS, status: Status.CONNECTION_CLOSED}));
		};
	}, []);

	return (
		<div style={{padding: '20px', fontFamily: 'monospace', maxWidth: '800px', margin: '0 auto'}}>
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
				<Timer lastReceivedDate={state.lastReceivedDate} />
			</div>

			{/* Control Button */}
			{state.messages.length > 0 && (
				<button
					onClick={() => dispatch({ type: Action.CLEAR_FEED })}
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
	);
}
