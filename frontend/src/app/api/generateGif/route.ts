import { type GifParams, handleApiError, proxyGenerateGif } from "@/_utils";

export async function POST(request: Request) {
	try {
		const body: GifParams = await request.json();

		const response = await proxyGenerateGif(body);

		if (!response.ok) {
			// Parse JSON error body returned by backend (validation errors carry details)
			let errorBody: Record<string, unknown> | null = null;
			try {
				errorBody = await response.json();
			} catch (_err) {
				// Fall back if response body is not JSON
			}

			if (errorBody && typeof errorBody === "object") {
				return new Response(JSON.stringify(errorBody), {
					status: response.status,
					headers: { "Content-Type": "application/json" },
				});
			}

			return new Response(
				JSON.stringify({
					error: response.statusText || "Failed to generate animated GIF",
				}),
				{
					status: response.status,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		const blob = await response.blob();

		return new Response(blob, {
			status: 200,
			headers: {
				"Content-Type": "image/gif",
			},
		});
	} catch (error) {
		return handleApiError(error, "generating animated GIF");
	}
}
