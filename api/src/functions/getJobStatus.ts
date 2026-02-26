import {
	app,
	type HttpRequest,
	type HttpResponseInit,
	type InvocationContext,
} from "@azure/functions";
import { createLogger } from "../lib/logger";
import { connectMongoDB, getJobModel } from "../lib/mongoose";

export async function getJobStatus(
	request: HttpRequest,
	context: InvocationContext,
): Promise<HttpResponseInit> {
	const logger = createLogger(context);

	try {
		await connectMongoDB(context);
		const Job = getJobModel();

		const jobId = request.query.get("jobId");
		if (!jobId) {
			logger.warn("Missing jobId query parameter");
			return {
				status: 400,
				jsonBody: { error: "Missing jobId query parameter" },
			};
		}

		const job = await Job.findById(jobId);
		if (!job) {
			logger.warn("Job not found", { jobId });
			return {
				status: 404,
				jsonBody: { error: "Job not found" },
			};
		}

		logger.info("Retrieved job status", { jobId, status: job.status });

		return {
			status: 200,
			jsonBody: {
				id: job._id,
				status: job.status,
				progress: job.results.length,
				total: job.requests.length,
				results: job.results,
				error: job.error,
				createdAt: job.createdAt,
				updatedAt: job.updatedAt,
			},
		};
	} catch (error) {
		logger.error(
			`Error fetching job status for ${request.query.get("jobId")}`,
			error,
		);

		return {
			status: 500,
			jsonBody: {
				error: error instanceof Error ? error.message : "Internal server error",
			},
		};
	}
}

app.http("getJobStatus", {
	methods: ["GET"],
	authLevel: "function",
	handler: getJobStatus,
});
