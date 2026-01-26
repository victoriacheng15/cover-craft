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
