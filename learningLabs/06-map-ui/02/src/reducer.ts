import {Action, type StatusType} from "./types.ts";

type State = {
	messages: string[],
	status: string,
	lastReceivedDate: Date | null,
}

type StateAction =
	| { type: typeof Action.ADD_MESSAGE; message: string }
	| { type: typeof Action.SET_STATUS; status: StatusType }
	| { type: typeof Action.CLEAR_FEED };

export const initialState: State = {
	messages: [],
	status: "connecting...",
	lastReceivedDate: null,
}

export function stateReducer(state: State, action: StateAction) {
	switch (action.type) {
		case Action.ADD_MESSAGE: {
			return {
				// Cap the length of the message array
				...state, messages: [...state.messages, action.message].slice(-100), lastReceivedDate: new Date()
			}
		} case Action.SET_STATUS: {
			return {
				...state, status: action.status
			}
		} case Action.CLEAR_FEED: {
			return {
				...state, messages: [], lastReceivedDate: null
			}
		}
		default: return state
	}
}