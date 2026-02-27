import { NextResponse } from "next/server";
import {
	handleApiError,
	type ImageParams,
	proxyGenerateImages,
} from "@/_utils";

export async function POST(request: Request) {
	try {
		const body: ImageParams[] = await request.json();

		const response = await proxyGenerateImages(body);

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
				{ error: response.statusText || "Failed to submit batch job" },
				{ status: response.status },
			);
		}

		const data = await response.json();
		return NextResponse.json(data, { status: response.status });
	} catch (error) {
		return handleApiError(error, "submitting batch job");
	}
}
