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

// Re-export type contracts
export {
	DOWNLOAD_CLICK_EVENT,
	type EventType,
	GENERATE_CLICK_EVENT,
	type ImageParams,
	type MetricPayload,
	type MetricStatus,
	type WcagLevel,
};

export type ApiErrorResponse = {
	error: string;
	details?: ValidationError[];
};

export type JobStatusResponse = {
	id: string;
	status: "pending" | "processing" | "completed" | "failed";
	progress: number;
	total: number;
	results: string[];
	error?: string;
	createdAt: string;
	updatedAt: string;
};

export interface HealthResponse {
	status: string;
	timestamp: string;
}

/**
 * Client-side function to fetch analytics data
 */
export async function getAnalytics() {
	const response = await fetch("/api/analytics");
	if (!response.ok) {
		throw new Error(`Failed to fetch analytics: ${response.statusText}`);
	}
	return response.json();
}

/**
 * Client-side function to call the generateImage endpoint and get blob
 */
export async function generateImage(
	params: ImageParams,
): Promise<{ blob: Blob; clientDuration: number; duration?: number }> {
	const startTime = performance.now();
	const response = await fetch("/api/generateImage", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(params),
	});

	const clientDuration = Math.round(performance.now() - startTime);

	if (!response.ok) {
		let errorBody: ApiErrorResponse | null = null;
		try {
			errorBody = await response.json();
		} catch (_err) {
			// ignore parse errors
		}
		const baseMessage = errorBody?.error ?? "Failed to generate cover image";
		const details =
			errorBody && Array.isArray(errorBody.details) ? errorBody.details : [];
		let message = baseMessage;
		if (details.length > 0) {
			const detailsText = details
				.map((detail) => `${detail.field}: ${detail.message}`)
				.join("; ");
			message = `${message}: ${detailsText}`;
		}
		const err = new Error(message) as Error & {
			clientDuration?: number;
			details?: ValidationError[];
		};
		err.clientDuration = clientDuration;
		err.details = details;
		throw err;
	}

	const blob = await response.blob();
	return { blob, clientDuration };
}

/**
 * Submit a batch generation job
 */
export async function generateBatchImages(
	params: ImageParams[],
): Promise<{ jobId: string }> {
	const response = await fetch("/api/generateImages", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(params),
	});

	if (!response.ok) {
		let errorBody: ApiErrorResponse | null = null;
		try {
			errorBody = await response.json();
		} catch (_err) {
			/* ignore */
		}
		throw new Error(errorBody?.error ?? "Failed to submit batch job");
	}

	return await response.json();
}

/**
 * Poll for batch job status
 */
export async function getBatchJobStatus(
	jobId: string,
): Promise<JobStatusResponse> {
	const response = await fetch(`/api/jobStatus?jobId=${jobId}`);

	if (!response.ok) {
		throw new Error("Failed to fetch job status");
	}

	return await response.json();
}

/**
 * Client-side function to check backend health
 */
export async function health(): Promise<HealthResponse> {
	const response = await fetch("/api/health");
	if (!response.ok) {
		throw new Error(`Health check failed: ${response.statusText}`);
	}
	return response.json();
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
