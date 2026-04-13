import type { ImageParams } from "@cover-craft/shared";

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
