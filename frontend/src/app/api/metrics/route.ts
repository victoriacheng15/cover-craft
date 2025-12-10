import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { proxyMetrics } from "../_utils/metrics";
import { handleApiError } from "../_utils/errorHandler";

export async function POST(req: NextRequest) {
	try {
		const data = await req.json();

		// Forward metrics to backend Azure Functions API
		const response = await proxyMetrics(data);

		if (!response.ok) {
			console.error("Failed to store metrics:", response.statusText);
			return NextResponse.json(
				{ success: false, error: "Failed to store metrics" },
				{ status: response.status },
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		return handleApiError(error, "forwarding metrics");
	}
}
