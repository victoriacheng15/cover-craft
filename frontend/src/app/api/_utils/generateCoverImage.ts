/**
 * Utility for generating cover images via the backend API
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface ImageParams {
	width: number;
	height: number;
	backgroundColor: string;
	textColor: string;
	font: string;
	title: string;
	subtitle?: string;
	filename: string;
};

// Error types for generateCoverImage
export type GenerateCoverErrorDetail = {
	field: string;
	message: string;
};

export type GenerateCoverErrorBody = {
	error?: string;
	details?: GenerateCoverErrorDetail[];
};

export type GenerateCoverImageError = Error & {
	clientDuration?: number;
	details?: GenerateCoverErrorDetail[];
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
		let errorBody: GenerateCoverErrorBody | null = null;
		try {
			errorBody = await response.json();
		} catch (_err) {
			// ignore parse errors
		}
		const baseMessage =
			errorBody?.error ?? "Failed to generate cover image";
		const details =
			errorBody && Array.isArray(errorBody.details) ? errorBody.details : [];
		let message = baseMessage;
		if (details.length > 0) {
			const detailsText = details
				.map((detail) => `${detail.field}: ${detail.message}`)
				.join("; ");
			message = `${message}: ${detailsText}`;
		}
		const err = new Error(message) as GenerateCoverImageError;
		err.clientDuration = clientDuration;
		err.details = details;
		throw err;
	}

	const blob = await response.blob();
	return { blob, clientDuration };
}

/**
 * Server-side proxy handler for the generateCoverImage endpoint
 * Forwards requests from Next.js to the backend API
 */
export async function proxyGenerateCoverImage(body: ImageParams) {
	const response = await fetch(`${API_URL}/generateCoverImage`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});

	return response;
}
