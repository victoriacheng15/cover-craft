import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7071/api";

export async function GET() {
	try {
		const response = await fetch(`${API_URL}/health`);
		if (!response.ok) {
			throw new Error(`Health check failed: ${response.statusText}`);
		}
		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Error fetching health:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to fetch health" },
			{ status: 500 },
		);
	}
}
