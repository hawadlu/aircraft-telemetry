import {useEffect, useState} from "react";

interface TimerProps {
	lastReceivedDate?: Date | null,
}

export default function Timer({lastReceivedDate}: TimerProps) {
	// Render once per second to keep the last received timer up to date
	const [now, setNow] = useState<Date>(new Date());


	useEffect(() => {
		const timer = setInterval(() => setNow(new Date()), 1000)

		return () => clearInterval(timer)
	}, [])

	function getLastReceived(): number | string {
		if (lastReceivedDate) {
			return Math.ceil(
				(now.getTime() - lastReceivedDate.getTime()) / 1000
			) + 's'
		}

		return "No telemetry received"
	}

	return <p>Last Received: {getLastReceived()}</p>
}