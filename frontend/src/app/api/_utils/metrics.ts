import {
	DOWNLOAD_CLICK_EVENT,
	type EventType,
	GENERATE_CLICK_EVENT,
	type MetricPayload,
	type MetricStatus,
	type WcagLevel,
} from "@cover-craft/shared";
export {
	DOWNLOAD_CLICK_EVENT,
	GENERATE_CLICK_EVENT,
	type MetricStatus,
	type WcagLevel,
	type EventType,
	type MetricPayload,
};

/**
 * Server-side proxy handler for the metrics endpoint
 */
export async function proxyMetrics(data: Record<string, unknown>) {
	const API_URL = process.env.AZURE_FUNCTION_URL;
	const response = await fetch(`${API_URL}/metrics`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});

	return response;
}
