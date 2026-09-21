import { NextResponse } from "next/server";
import { handleApiError, proxyGenerateCarousel } from "@/_utils";

/**
 * BFF proxy route for LinkedIn carousel generation (POST /api/generateCarousel).
 *
 * Forwards client requests to the Azure Functions serverless backend.
 * Returns HTTP 501 (Not Implemented) during early scaffolding, and will return
 * HTTP 202 (Accepted) with the async job ID once the background worker is wired.
 */
export async function POST(request: Request) {
	try {
		const body: unknown = await request.json();

		const response = await proxyGenerateCarousel(body);

		if (!response.ok) {
			let errorBody: Record<string, unknown> | null = null;
			try {
				errorBody = await response.json();
			} catch (_err) {
				// Non-JSON response
			}

			if (errorBody && typeof errorBody === "object") {
				return NextResponse.json(errorBody, {
					status: response.status,
				});
			}

			return NextResponse.json(
				{ error: response.statusText || "Failed to submit carousel job" },
				{ status: response.status },
			);
		}

		const data = await response.json();
		return NextResponse.json(data, { status: response.status });
	} catch (error) {
		return handleApiError(error, "submitting carousel job");
	}
}
