import { NextResponse } from "next/server";
import { handleApiError, proxyAnalytics } from "@/_utils";

export async function GET() {
	try {
		const data = await proxyAnalytics();
		return NextResponse.json(data);
	} catch (error) {
		return handleApiError(error, "fetching analytics");
	}
}
