import {useEffect, useReducer} from 'react';
import * as signalR from '@microsoft/signalr';

export default function App() {
	const initialState = {
		messages: [],
		status: "connecting...",
		lastReceivedDate: null,
		lastReceivedSecondsAgo: null
	}

	function stateReducer(state, action) {
		switch (action.type) {
			case "ADD_MESSAGE": {
				return {
					...state, messages: [...state.messages, action.message], lastReceivedDate: new Date()
				}
			} case "SET_STATUS": {
				return {
					...state, status: action.status
				}
			} case "SET_LAST_TIME": {
					const lastReceivedSecondsAgoNew =
						state.lastReceivedDate
							? Math.floor(
								(Date.now() - state.lastReceivedDate.getTime()) / 1000
							)
							: null;

					return {
						...state,
						lastReceivedSecondsAgo: lastReceivedSecondsAgoNew
					};
				}
			case "CLEAR_FEED": {
				return {
					...state, messages: []
				}
			}
			default: return state
		}
		// const lastReceivedSecondsAgo = lastReceivedDate ? (new Date().getTime() - lastReceivedDate.getTime()) / 1000 : null
		// return {
		// 	messages: messages,
		// 	status: status,
		// 	lastReceivedDate: lastReceivedDate,
		// 	lastReceivedSecondsAgo: lastReceivedSecondsAgo
		// }
	}

	const [state, dispatch] = useReducer(stateReducer, initialState);

	// const [messages, setMessages] = useState([]);
	// const [status, setStatus] = useState('Connecting...');
	//
	// const [lastReceivedDate, setLastReceivedDate] = useState<Date | null>(null)
	// const [lastReceivedSecondsAgo, setLastReceivedSecondsAgo] = useState<number | null>(null)

	useEffect(() => {
		// 1. Configure connection
		const connection = new signalR.HubConnectionBuilder()
			.withUrl('http://localhost:5002/events') // Your Hub URL
			.withAutomaticReconnect()
			.build();

		// 2. Start connection
		connection.start()
			// .then(() => setStatus('Connected ✔️'))
			.then(() => dispatch({type: "SET_STATUS", status: "Connected"}))
			// .catch(err => setStatus(`Connection Failed ❌: ${err.message}`));
			.catch(err => dispatch({type: "SET_STATUS", status: `Connection Failed ❌: ${err.message}`}))

		// 3. Listen for incoming JSON payloads
		// Change "ReceiveMessage" to match your backend's broadcast event name
		connection.on('MessagePublished', (data) => {
			const formattedJson = typeof data === 'object'
				? JSON.stringify(data, null, 2)
				: data;

			dispatch({type: "ADD_MESSAGE", message: formattedJson})
			// dispatch({messages: [...state.messages, formattedJson], status: state.status, lastReceivedDate: new Date()})
			// setLastReceivedDate(new Date())
			// setMessages((prev) => [formattedJson, ...prev]);
		});

		// Reconnect behaviour
        // connection.onreconnecting(() => setStatus("Reconnecting"))
        // connection.onreconnected(() => setStatus("Connected"))
        // connection.onclose(() => setStatus("Connection closed"))

		// connection.onreconnecting(() => dispatch({messages: state.messages, status: "Reconnecting", lastReceivedDate: state.lastReceivedDate}))
		connection.onreconnecting(() => dispatch({type: "SET_STATUS", status: "Connected"}))
		// connection.onreconnected(() => dispatch({messages: state.messages, status: "Connected", lastReceivedDate: state.lastReceivedDate}))
		connection.onreconnected(() => dispatch({type: "SET_STATUS", status: "Connected"}))
		// connection.onclose(() => dispatch({messages: state.messages, status: "Connection closed", lastReceivedDate: state.lastReceivedDate}))
		connection.onclose(() => dispatch({type: "SET_STATUS", status: "Connection closed"}))

		// Timer
		setInterval(() => {
			dispatch({ type: "SET_LAST_TIME" });
		}, 1000);



		// Cleanup connection when the component unmounts
		return () => {
			connection.stop();
		};
	}, []);


	return (
		<div style={{padding: '20px', fontFamily: 'monospace', maxWidth: '800px', margin: '0 auto'}}>
			<h2>SignalR JSON Feed</h2>

			{/* Status Bar */}
			<div style={{
				padding: '10px',
				borderRadius: '4px',
				backgroundColor: state.status.includes('Connected') ? '#e6fffa' : '#fff5f5',
				color: state.status.includes('Connected') ? '#234e52' : '#9b2c2c',
				marginBottom: '15px'
			}}>
				<strong>Status:</strong> {state.status}
				<p>Last telemetry received: {state.lastReceivedSecondsAgo !== null
					? `${state.lastReceivedSecondsAgo}s`
					: "No telemetry received"}
				</p>
			</div>

			{/* Control Button */}
			{state.messages.length > 0 && (
				<button
					onClick={() => dispatch({ type: "CLEAR_FEED" })}
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
