import type { ImageParams } from "@cover-craft/shared";

/**
 * Server-side proxy handler for the generateImages (batch) endpoint
 */
export async function proxyGenerateImages(body: ImageParams[]) {
	const API_URL = process.env.AZURE_FUNCTION_URL;
	const response = await fetch(`${API_URL}/generateImages`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});

	return response;
}
