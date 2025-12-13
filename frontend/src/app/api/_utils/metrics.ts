import {
	DOWNLOAD_CLICK_EVENT,
	type EventType,
	GENERATE_CLICK_EVENT,
	type MetricPayload,
	type MetricStatus,
	type WcagLevel,
} from "@/shared/metricPayload";
export {
	DOWNLOAD_CLICK_EVENT,
	GENERATE_CLICK_EVENT,
	type MetricStatus,
	type WcagLevel,
	type EventType,
	type MetricPayload,
};

/**
 * Client-side function to send metrics to the backend
 */
export async function sendMetrics(data: Record<string, unknown>) {
	const response = await fetch("/api/metrics", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		throw new Error(`Failed to send metrics: ${response.statusText}`);
	}

	return response.json();
}

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

/**
 * Client-side function to send generate cover event
 */
export async function sendGenerateEvent(payload: Partial<MetricPayload>) {
	try {
		const payloadToSend: MetricPayload = {
			event: GENERATE_CLICK_EVENT,
			timestamp: new Date().toISOString(),
			status: "success",
			...payload,
		};

		if (
			!payloadToSend ||
			typeof payloadToSend !== "object" ||
			Array.isArray(payloadToSend) ||
			typeof payloadToSend.event !== "string"
		) {
			return;
		}

		await fetch("/api/metrics", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payloadToSend),
		});
	} catch (_err) {
		// Silently fail - metrics are not critical to app functionality
	}
}

/**
 * Client-side function to send download event
 */
export async function sendDownloadEvent(payload?: Partial<MetricPayload>) {
	try {
		const payloadToSend: MetricPayload = {
			event: DOWNLOAD_CLICK_EVENT,
			timestamp: new Date().toISOString(),
			status: "success",
			...payload,
		};

		if (
			!payloadToSend ||
			typeof payloadToSend !== "object" ||
			Array.isArray(payloadToSend) ||
			typeof payloadToSend.event !== "string"
		) {
			return;
		}

		await fetch("/api/metrics", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payloadToSend),
		});
	} catch (_err) {
		// Silently fail - metrics are not critical to app functionality
	}
}
