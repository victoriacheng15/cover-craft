import { NextResponse } from "next/server";
import { proxyHealth } from "../_utils/health";
import { handleApiError } from "../_utils/errorHandler";

export async function GET() {
	try {
		const data = await proxyHealth();
		return NextResponse.json(data);
	} catch (error) {
		return handleApiError(error, "fetching health");
	}
}
