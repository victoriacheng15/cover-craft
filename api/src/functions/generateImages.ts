import type {
	HttpHandler,
	HttpRequest,
	HttpResponseInit,
} from "@azure/functions";
import { app, type InvocationContext } from "@azure/functions";
import {
	getContrastRatio,
	getWCAGLevelFromRatio,
	type ImageParams,
	JOB_STATUS_PENDING,
	METRIC_STATUS_VALIDATION_ERROR,
	validateBatchRequest,
} from "@cover-craft/shared";
import { ObjectId } from "mongodb";
import { createLogger } from "../lib/logger";
import { connectMongoDB, getJobModel } from "../lib/mongoose";
import { buildMetricPayload, storeMetricsToMongoDB } from "./metrics";

const DEFAULT_MAX_JOB_ATTEMPTS = 3;

export const generateImages: HttpHandler = async (
	request: HttpRequest,
	context: InvocationContext,
): Promise<HttpResponseInit> => {
	const logger = createLogger(context);
	logger.info("generateImages() function triggered");

	try {
		await connectMongoDB(context);
		const Job = getJobModel();

		// 1. Parse and Validate Batch Payload
		const body = await request.json();

		if (!Array.isArray(body)) {
			logger.warn("Payload is not a JSON array");
			return {
				status: 400,
				jsonBody: {
					error: "Payload must be a JSON array of image configurations.",
				},
			};
		}

		const requests = body as ImageParams[];
		const validationErrors = validateBatchRequest(requests);

		if (validationErrors.length > 0) {
			logger.warn("Batch validation failed", { errors: validationErrors });

			// Capture validation error metrics
			for (const item of requests) {
				try {
					const contrastRatio = getContrastRatio(
						item.backgroundColor || "#FFFFFF",
						item.textColor || "#000000",
					);
					const validationMessage = validationErrors
						.filter((e) =>
							e.field.includes(`requests[${requests.indexOf(item)}]`),
						)
						.map((e) => e.message)
						.join("; ");

					await storeMetricsToMongoDB(
						buildMetricPayload(METRIC_STATUS_VALIDATION_ERROR, {
							size: { width: item.width, height: item.height },
							font: item.font,
							titleLength: item.title?.length || 0,
							subtitleLength: item.subtitle?.length || 0,
							contrastRatio: contrastRatio ?? undefined,
							wcagLevel:
								contrastRatio !== null
									? getWCAGLevelFromRatio(contrastRatio)
									: undefined,
							errorMessage: (validationMessage || "Validation failed").slice(
								0,
								1000,
							),
						}),
						context,
					);
				} catch (mErr) {
					logger.warn(
						"Failed to store individual metric during batch validation failure",
						{ error: mErr },
					);
				}
			}

			return {
				status: 400,
				jsonBody: {
					error: "Validation failed",
					details: validationErrors,
				},
			};
		}

		// 2. Provision Pending Job in MongoDB
		const jobId = new ObjectId();
		await Job.create({
			_id: jobId,
			status: JOB_STATUS_PENDING,
			requests: requests as unknown as Record<string, unknown>[],
			results: [],
			attempts: 0,
			maxAttempts: DEFAULT_MAX_JOB_ATTEMPTS,
			resultDetails: {},
		});

		logger.info("Provisioned pending batch job", {
			jobId: jobId.toString(),
			size: requests.length,
		});

		// 3. Connect to Azure Queue Storage using the v12 SDK
		const storageConnectionString = process.env.AzureWebJobsStorage;
		if (!storageConnectionString) {
			throw new Error("AzureWebJobsStorage is not configured.");
		}

		const { QueueClient } = await import("@azure/storage-queue");
		const queueClient = new QueueClient(storageConnectionString, "batch-jobs");

		await queueClient.createIfNotExists();
		const base64Message = Buffer.from(jobId.toString()).toString("base64");
		await queueClient.sendMessage(base64Message);

		return {
			status: 202,
			jsonBody: {
				message: "Batch job accepted for processing.",
				jobId: jobId.toString(),
			},
		};
	} catch (error: unknown) {
		logger.error("batch provision error", error);
		return {
			status: 500,
			jsonBody: {
				error: error instanceof Error ? error.message : String(error),
			},
		};
	}
};

app.http("generateImages", {
	methods: ["POST"],
	authLevel: "function",
	handler: generateImages,
});
