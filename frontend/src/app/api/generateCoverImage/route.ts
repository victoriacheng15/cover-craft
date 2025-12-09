import type { ImageParams } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7071/api";

export async function POST(request: Request) {
	try {
		const body: ImageParams = await request.json();

		const response = await fetch(`${API_URL}/generateCoverImage`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			// Try to parse JSON error body returned by backend (validation errors carry details)
			let errorBody: Record<string, unknown> | null = null;
			try {
				errorBody = await response.json();
			} catch (_err) {
				// Not JSON - fall back to statusText
			}

			// If backend provided structured error info, forward it (maintain status code)
			if (errorBody && typeof errorBody === "object") {
				return new Response(JSON.stringify({ success: false, ...errorBody }), {
					status: response.status,
					headers: { "Content-Type": "application/json" },
				});
			}

			// Otherwise fallback to status text or generic error
			return new Response(
				JSON.stringify({
					success: false,
					error: response.statusText || "Failed to generate image",
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
				"Content-Type": "image/png",
			},
		});
	} catch (error) {
		console.error("Error generating cover image:", error);
		return new Response(
			JSON.stringify({
				success: false,
				error:
					error instanceof Error ? error.message : "Failed to generate image",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
