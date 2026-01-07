import {
	app,
	type HttpRequest,
	type HttpResponseInit,
	type InvocationContext,
} from "@azure/functions";
import { connectMongoDB, getMetricModel } from "../lib/mongoose";
import type { MetricPayload } from "../shared/metricPayload";
import { createLogger } from "../lib/logger";

// POST /api/metrics
// Receives metrics/events from the frontend and stores to MongoDB for persistence
export async function metrics(
	request: HttpRequest,
	context: InvocationContext,
): Promise<HttpResponseInit> {
	const logger = createLogger(context);
	logger.info("metrics() function triggered");

	try {
		await connectMongoDB(context);

		// Parse and validate incoming metrics data
		const metricsData = (await request.json()) as MetricPayload;

		// Validate required fields
		if (!metricsData.event || !metricsData.timestamp) {
			logger.warn("Validation Error: Missing required fields", {
				details: metricsData,
			});
			return {
				status: 400,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					error: "Missing required fields: event, timestamp",
				}),
			};
		}

		await storeMetricsToMongoDB(metricsData, context);
		logger.info("Metrics processed successfully", { details: metricsData });

		return {
			status: 200,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				data: {
					received: metricsData,
					serverTime: new Date().toISOString(),
				},
			}),
		};
	} catch (error) {
		logger.error("Error processing metrics:", error);
		return {
			status: 500,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				error: "Failed to process metrics",
			}),
		};
	}
}

export async function storeMetricsToMongoDB(
	metricsData: MetricPayload,
	context: InvocationContext,
): Promise<void> {
	const logger = createLogger(context); // Instantiate logger in helper function too
	try {
		await connectMongoDB(context);
		const Metric = getMetricModel();
		const metric = new Metric({
			...metricsData,
			timestamp: new Date(metricsData.timestamp),
		});
		await metric.save();
		logger.info("Metrics stored to MongoDB:", { metricId: metric._id, event: metric.event });
	} catch (error) {
		logger.error("Error storing metrics to MongoDB:", error);
		throw error;
	}
}

app.http("metrics", {
	methods: ["POST"],
	authLevel: "anonymous",
	handler: metrics,
});
