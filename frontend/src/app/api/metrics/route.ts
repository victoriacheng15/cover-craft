import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { handleApiError, proxyMetrics } from "@/_utils";

export async function POST(req: NextRequest) {
	try {
		const data = await req.json();

		// Forward metrics to backend Azure Functions API
		const response = await proxyMetrics(data);

		if (!response.ok) {
			console.error("Failed to store metrics:", response.statusText);
			let errorBody: Record<string, unknown> | null = null;
			try {
				errorBody = await response.json();
			} catch (_err) {
				// Not JSON - fall back to statusText
			}

			if (errorBody && typeof errorBody === "object") {
				return NextResponse.json(errorBody, { status: response.status });
			}

			return NextResponse.json(
				{ error: response.statusText || "Failed to store metrics" },
				{ status: response.status },
			);
		}

		const responseData = await response.json();
		return NextResponse.json(responseData);
	} catch (error) {
		return handleApiError(error, "forwarding metrics");
	}
}
