/**
 * Utility for sending metrics to the backend API
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Types for metrics
export type MetricsPayload = Record<string, unknown>;
export type MetricTimestamp = string | Date | number;
export type WcagLevel = "AAA" | "AA" | "FAIL"; // WCAG compliance level

export interface GenerateClickMetrics {
	event: "generate_click";
	timestamp: MetricTimestamp;
	status: "success" | "error";
	size: {
		width: number;
		height: number;
	};
	font: string;
	titleLength: number;
	subtitleLength?: number;
	contrastRatio: number;
	wcagLevel: WcagLevel;
	clientDuration?: number;
	errorMessage?: string;
}

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
	const response = await fetch(`${API_URL}/metrics`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});

	return response;
}
