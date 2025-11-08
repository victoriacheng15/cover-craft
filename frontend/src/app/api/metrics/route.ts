import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Metric from "@/models/Metric";

export async function POST(req: NextRequest) {
  await dbConnect();
  const data = await req.json();
  const metric = new Metric({
    ...data,
    timestamp: new Date(data.timestamp || Date.now()),
  });
  await metric.save();
  return NextResponse.json({ success: true });
}
