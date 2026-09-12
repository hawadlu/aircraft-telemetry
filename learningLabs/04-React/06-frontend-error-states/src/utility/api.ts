import {SystemDataTelemetryPoint} from "../components/common";
import {systemDataTelemetryPointSchema} from "../components/common/types/schema";
import {Dispatch, SetStateAction} from "react";
import {z} from "zod";

export async function getTelemetry(setApiStatus: Dispatch<SetStateAction<string>>):Promise<SystemDataTelemetryPoint> {
	try {
		const response = await fetch('/api/latest');

		if (!response.ok) {
			setApiStatus("network error: " + translateHttpStatus(response.status))
		} else {
			// Validated the json
			const rawJson = await response.json();
			const data: SystemDataTelemetryPoint =  systemDataTelemetryPointSchema.parse(rawJson);
			setApiStatus("Connected");
			return data;
		}
	} catch (error) {
		if (error instanceof z.ZodError) setApiStatus("Data validation failed");
		if (error instanceof SyntaxError) setApiStatus("Syntax failure")
		if (error instanceof TypeError) setApiStatus("Network failure")
	}

	throw { type: 'UNKNOWN_ERROR', message: 'An unexpected error occurred.' };
}

function translateHttpStatus(status: number): string {
	switch (status) {
		case 502: return "Not connected"
		case 404: return "No data found"
		default: return "Unknown http error"
	}
}