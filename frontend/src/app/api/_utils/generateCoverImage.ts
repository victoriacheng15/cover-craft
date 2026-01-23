/**
 * Utility for generating cover images via the backend API
 */
import type { ImageParams, ValidationError } from "@cover-craft/shared";
export type { ImageParams };

export type ApiErrorResponse = {
	error: string;
	details?: ValidationError[];
};

/**
 * Client-side function to call the generateCoverImage endpoint and get blob
 */
export async function generateCoverImage(
	params: ImageParams,
): Promise<{ blob: Blob; clientDuration: number; duration?: number }> {
	const startTime = performance.now();
	const response = await fetch("/api/generateCoverImage", {
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
 * Server-side proxy handler for the generateCoverImage endpoint
 */
export async function proxyGenerateCoverImage(body: ImageParams) {
	const API_URL = process.env.AZURE_FUNCTION_URL;
	const response = await fetch(`${API_URL}/generateCoverImage`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});

	return response;
}
