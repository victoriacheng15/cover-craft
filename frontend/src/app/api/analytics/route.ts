import { NextResponse } from "next/server";
import { proxyAnalytics } from "../_utils/analytics";
import { handleApiError } from "../_utils/errorHandler";

export async function GET() {
	try {
		const data = await proxyAnalytics();
		return NextResponse.json(data);
	} catch (error) {
		return handleApiError(error, "fetching analytics");
	}
}
