import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Metric from "@/models/Metric";

export async function GET(req: NextRequest) {
  await dbConnect();

  // Aggregate counts for each event type
  const eventCounts = await Metric.aggregate([
    { $group: { _id: "$event", count: { $sum: 1 } } },
  ]);

  // Total generate_click and download_click counts
  const generateClickCount = await Metric.countDocuments({
    event: "generate_click",
  });
  const downloadClickCount = await Metric.countDocuments({
    event: "download_click",
  });

  // Per-month counts for generate_click and download_click
  const generateClicksPerMonth = await Metric.aggregate([
    { $match: { event: "generate_click" } },
    {
      $group: {
        _id: { year: { $year: "$timestamp" }, month: { $month: "$timestamp" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);
  const downloadClicksPerMonth = await Metric.aggregate([
    { $match: { event: "download_click" } },
    {
      $group: {
        _id: { year: { $year: "$timestamp" }, month: { $month: "$timestamp" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  // Aggregate generate_click by font and sizePreset
  const generateByFont = await Metric.aggregate([
    { $match: { event: "generate_click" } },
    { $group: { _id: "$font", count: { $sum: 1 } } },
  ]);
  const generateBySize = await Metric.aggregate([
    { $match: { event: "generate_click" } },
    { $group: { _id: "$sizePreset", count: { $sum: 1 } } },
  ]);

  return NextResponse.json({
    eventCounts,
    generateClickCount,
    downloadClickCount,
    generateClicksPerMonth,
    downloadClicksPerMonth,
    generateByFont,
    generateBySize,
  });
}
