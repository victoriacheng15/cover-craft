import { NextResponse } from "next/server";
import { handleApiError } from "../_utils/errorHandler";
import { proxyHealth } from "../_utils/health";

export async function GET() {
	try {
		const data = await proxyHealth();
		return NextResponse.json(data);
	} catch (error) {
		return handleApiError(error, "fetching health");
	}
}
