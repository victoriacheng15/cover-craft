import {
	app,
	type HttpRequest,
	type HttpResponseInit,
	type InvocationContext,
} from "@azure/functions";
import { connectMongoDB, getMetricModel } from "../lib/mongoose";

interface MetricsData {
	// Core event data
	event: string;
	timestamp: string;
	status: "success" | "error" | "validation_error";
	errorMessage?: string;

	// Cover generation data
	sizePreset: string;
	font: string;
	titleLength: number;
	subtitleLength?: number;

	// Form/Validation data
	contrastRatio: number;
	wcagLevel: string; // "AAA" | "AA" | "FAIL"

	// Performance/Timing data
	duration?: number; // in milliseconds (generation time, render time, etc.)
	clientDuration?: number; // time on client side (ms)
}

// POST /api/metrics
// Receives metrics/events from the frontend and stores to MongoDB for persistence
export async function metrics(
	request: HttpRequest,
	context: InvocationContext,
): Promise<HttpResponseInit> {
	context.log("metrics() function triggered");

	try {
		await connectMongoDB(context);

		// Parse and validate incoming metrics data
		const metricsData = (await request.json()) as MetricsData;

		// Validate required fields
		if (!metricsData.event || !metricsData.timestamp) {
			return {
				status: 400,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					success: false,
					error: "Missing required fields: event, timestamp",
				}),
			};
		}

		await storeMetricsToMongoDB(metricsData, context);

		return {
			status: 200,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				success: true,
				message: "Metrics received",
				data: {
					received: metricsData,
					serverTime: new Date().toISOString(),
				},
			}),
		};
	} catch (error) {
		context.error("Error processing metrics:", error);
		return {
			status: 500,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				success: false,
				error: "Failed to process metrics",
			}),
		};
	}
}

async function storeMetricsToMongoDB(
	metricsData: MetricsData,
	context: InvocationContext,
): Promise<void> {
	try {
		const Metric = getMetricModel();
		const metric = new Metric({
			...metricsData,
			timestamp: new Date(metricsData.timestamp),
		});
		await metric.save();
		context.log("Metrics stored to MongoDB:", metric._id);
	} catch (error) {
		context.error("Error storing metrics to MongoDB:", error);
		throw error;
	}
}

app.http("metrics", {
	methods: ["POST"],
	authLevel: "anonymous",
	handler: metrics,
});
