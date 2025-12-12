import { NextResponse } from "next/server";
import { handleApiError, proxyHealth } from "@/_utils";

export async function GET() {
	try {
		const data = await proxyHealth();
		return NextResponse.json(data);
	} catch (error) {
		return handleApiError(error, "fetching health");
	}
}
