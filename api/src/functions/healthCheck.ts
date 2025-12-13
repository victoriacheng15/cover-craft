import {
	app,
	type HttpRequest,
	type HttpResponseInit,
	type InvocationContext,
} from "@azure/functions";

export async function healthCheck(
	_request: HttpRequest,
	context: InvocationContext,
): Promise<HttpResponseInit> {
	try {
		const now = new Date();

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
		context.error("Health check error:", error);
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
