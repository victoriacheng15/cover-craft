import {
	DOWNLOAD_CLICK_EVENT,
	type EventType,
	GENERATE_CLICK_EVENT,
	type ImageParams,
	type MetricPayload,
	type MetricStatus,
	type ValidationError,
	type WcagLevel,
} from "@cover-craft/shared";
import { NextResponse } from "next/server";

export {
	DOWNLOAD_CLICK_EVENT,
	type EventType,
	GENERATE_CLICK_EVENT,
	type ImageParams,
	type MetricPayload,
	type MetricStatus,
	type WcagLevel,
};

// Error response type - matches unified backend error format
export type ApiErrorResponse = {
	error: string;
	details?: ValidationError[];
};

export interface HealthResponse {
	status: string;
	timestamp: string;
}

/**
 * Handle unexpected errors in route handlers
 * Returns error in unified format: { error: string, details?: [...] }
 */
export function handleApiError(error: unknown, context: string) {
	console.error(`Error ${context}:`, error);

	const message =
		error instanceof Error ? error.message : "An unexpected error occurred";

	return NextResponse.json(
		{
			error: message,
		} as ApiErrorResponse,
		{ status: 500 },
	);
}

/**
 * Server-side proxy handler for the analytics endpoint
 */
export async function proxyAnalytics() {
	const API_URL = process.env.AZURE_FUNCTION_URL;

	const response = await fetch(`${API_URL}/analytics`);
	if (!response.ok) {
		throw new Error(`Failed to fetch analytics: ${response.statusText}`);
	}
	return response.json();
}

/**
 * Server-side proxy handler for the generateImage endpoint
 */
export async function proxyGenerateImage(body: ImageParams) {
	const API_URL = process.env.AZURE_FUNCTION_URL;
	const response = await fetch(`${API_URL}/generateImage`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});

	return response;
}

/**
 * Server-side proxy handler for the generateImages (batch) endpoint
 */
export async function proxyGenerateImages(body: ImageParams[]) {
	const API_URL = process.env.AZURE_FUNCTION_URL;
	const API_KEY = process.env.AZURE_FUNCTION_KEY;
	if (!API_URL) {
		throw new Error("Azure Functions API URL is missing for batch generation.");
	}

	const response = await fetch(`${API_URL}/generateImages`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"x-functions-key": API_KEY || "",
		},
		body: JSON.stringify(body),
	});

	return response;
}

/**
 * Server-side proxy handler for the health endpoint
 */
export async function proxyHealth() {
	const API_URL = process.env.AZURE_FUNCTION_URL;
	const response = await fetch(`${API_URL}/health`);
	if (!response.ok) {
		throw new Error(`Health check failed: ${response.statusText}`);
	}
	return response.json();
}

/**
 * Server-side proxy handler for the getJobStatus endpoint
 */
export async function proxyJobStatus(jobId: string) {
	const API_URL = process.env.AZURE_FUNCTION_URL;
	const API_KEY = process.env.AZURE_FUNCTION_KEY;
	if (!API_URL) {
		throw new Error(
			"Azure Functions API URL is missing for job status polling.",
		);
	}

	const response = await fetch(`${API_URL}/getJobStatus?jobId=${jobId}`, {
		headers: {
			"x-functions-key": API_KEY || "",
		},
	});

	return response;
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
