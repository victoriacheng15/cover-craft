import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7071/api";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Forward metrics to backend Azure Functions API
    const response = await fetch(`${API_URL}/metrics`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error("Failed to store metrics:", response.statusText);
      return NextResponse.json(
        { success: false, error: "Failed to store metrics" },
        { status: response.status },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error forwarding metrics:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
