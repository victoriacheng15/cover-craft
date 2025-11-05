import { NextResponse } from "next/server";

export async function GET() {
  // Proxy to Azure Functions healthCheck endpoint
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7071/api";
  const response = await fetch(`${apiUrl}/healthCheck`);
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
