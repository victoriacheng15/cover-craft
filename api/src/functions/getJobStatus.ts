import {
	app,
	type HttpRequest,
	type HttpResponseInit,
	type InvocationContext,
} from "@azure/functions";
import type { Types } from "mongoose";
import { createLogger } from "../lib/logger";
import {
	connectMongoDB,
	getJobModel,
	type JobDocument,
	type JobResult,
} from "../lib/mongoose";

interface JobWithId extends JobDocument {
	_id: Types.ObjectId;
}

function publicResultFromDetail(detail: JobResult): string {
	if (detail.status === "success" && detail.dataUrl) {
		return detail.dataUrl;
	}

	return `error: ${detail.error || "Failed to render"}`;
}

function getFinalResults(job: JobDocument): string[] {
	const resultDetails = job.resultDetails ?? {};
	const detailKeys = Object.keys(resultDetails);

	if (detailKeys.length === 0) {
		return job.results ?? [];
	}

	return detailKeys
		.map((key) => resultDetails[key])
		.sort((a, b) => a.index - b.index)
		.map(publicResultFromDetail);
}

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

		let job: JobWithId | null = null;

		// 1. Try full ObjectId lookup first
		if (jobId.length === 24 && /^[0-9a-fA-F]{24}$/.test(jobId)) {
			job = (await Job.findById(jobId)) as JobWithId | null;
		}
		// 2. Try partial lookup for 8-character hex strings (last 8 chars)
		else if (jobId.length === 8 && /^[0-9a-fA-F]{8}$/.test(jobId)) {
			const results = await Job.aggregate([
				{
					$addFields: {
						idStr: { $toString: "$_id" },
					},
				},
				{
					$match: {
						idStr: { $regex: `${jobId}$` },
					},
				},
				{ $limit: 1 },
			]);
			job = results.length > 0 ? (results[0] as JobWithId) : null;
		} else {
			return {
				status: 400,
				jsonBody: {
					error:
						"Invalid Job ID format. Provide either the full 24-character ID or the last 8 characters.",
				},
			};
		}

		if (!job) {
			logger.warn("Job not found", { jobId });
			return {
				status: 404,
				jsonBody: { error: "Job not found" },
			};
		}

		logger.info("Retrieved job status", { jobId, status: job.status });

		const results = getFinalResults(job);

		return {
			status: 200,
			jsonBody: {
				id: job._id.toString(),
				status: job.status,
				progress: results.length,
				total: job.requests.length,
				results,
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
