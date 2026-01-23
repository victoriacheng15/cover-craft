import {
	app,
	type HttpRequest,
	type HttpResponseInit,
	type InvocationContext,
} from "@azure/functions";
import { fetchAggregatedAnalytics } from "../lib/analyticsQueries";
import { createLogger } from "../lib/logger";
import { connectMongoDB } from "../lib/mongoose";

export async function analytics(
	_request: HttpRequest,
	context: InvocationContext,
): Promise<HttpResponseInit> {
	const logger = createLogger(context);

	try {
		await connectMongoDB(context);

		const analyticsData = await fetchAggregatedAnalytics(context);

		return {
			status: 200,
			body: JSON.stringify({ data: analyticsData }),
			headers: { "Content-Type": "application/json" },
		};
	} catch (error) {
		logger.error("Error fetching analytics:", error);
		return {
			status: 500,
			body: JSON.stringify({
				error: "Failed to fetch analytics",
			}),
			headers: { "Content-Type": "application/json" },
		};
	}
}

app.http("analytics", {
	methods: ["GET"],
	authLevel: "anonymous",
	handler: analytics,
});
