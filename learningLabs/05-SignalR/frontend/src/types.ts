export const Action = {
	ADD_MESSAGE: "ADD_MESSAGE",
	SET_STATUS: "SET_STATUS",
	CLEAR_FEED: "CLEAR_FEED"
} as const;

export const Status = {
	CONNECTED: "Connected",
	CONNECTION_CLOSED: "Connection closed",
	CONNECTION_FAILED: "Connection failed",
	RECONNECTING: "Reconnecting",
	RETRY: "Reconnecting",
	MAX_CONNECTIONS: "Reached max connection attempts",
} as const;
export type StatusType = typeof Status[keyof typeof Status];