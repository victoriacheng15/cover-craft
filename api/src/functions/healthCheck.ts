import {
	app,
	type HttpRequest,
	type HttpResponseInit,
	type InvocationContext,
} from "@azure/functions";
import { createLogger } from "../lib/logger";
import { connectMongoDB } from "../lib/mongoose";

export async function healthCheck(
	_request: HttpRequest,
	context: InvocationContext,
): Promise<HttpResponseInit> {
	const logger = createLogger(context);

	try {
		await connectMongoDB(context);
		const now = new Date();
		logger.info("Health check triggered");

		return {
			status: 200,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				data: {
					localTime: now.toLocaleString(),
					isoTime: now.toISOString(),
				},
			}),
		};
	} catch (error) {
		logger.error("Health check error:", error);
		return {
			status: 500,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				error: "Health check failed",
			}),
		};
	}
}

app.http("health", {
	methods: ["GET"],
	authLevel: "anonymous",
	handler: healthCheck,
});
