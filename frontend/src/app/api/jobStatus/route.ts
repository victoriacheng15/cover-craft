import { type NextRequest, NextResponse } from "next/server";
import { handleApiError, proxyJobStatus } from "@/_utils";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const jobId = searchParams.get("jobId");

		if (!jobId) {
			return NextResponse.json(
				{ error: "Missing jobId parameter" },
				{ status: 400 },
			);
		}

		const response = await proxyJobStatus(jobId);

		if (!response.ok) {
			let errorBody: Record<string, unknown> | null = null;
			try {
				errorBody = await response.json();
			} catch (_err) {
				// Not JSON
			}

			if (errorBody && typeof errorBody === "object") {
				return NextResponse.json(errorBody, {
					status: response.status,
				});
			}

			return NextResponse.json(
				{ error: response.statusText || "Failed to fetch job status" },
				{ status: response.status },
			);
		}

		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		return handleApiError(error, "fetching job status");
	}
}
