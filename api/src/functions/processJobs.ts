import { performance } from "node:perf_hooks";
import { app, type InvocationContext } from "@azure/functions";
import {
	getContrastRatio,
	getWCAGLevelFromRatio,
	type ImageParams,
	JOB_STATUS_COMPLETED,
	JOB_STATUS_FAILED,
	JOB_STATUS_PROCESSING,
	METRIC_STATUS_ERROR,
	METRIC_STATUS_SUCCESS,
} from "@cover-craft/shared";
import { createLogger } from "../lib/logger";
import { connectMongoDB, getJobModel } from "../lib/mongoose";
import { generatePNG } from "../services/imageService";
import { buildMetricPayload, storeMetricsToMongoDB } from "./metrics";

export async function processJobs(
	queueItem: unknown,
	context: InvocationContext,
): Promise<void> {
	const logger = createLogger(context);
	logger.info("processJobs() triggered with queue item", { queueItem });

	try {
		await connectMongoDB(context);
		const Job = getJobModel();

		// Azure Storage Queues v10+ automatically decode the base64 string for us
		const jobIdStr = String(queueItem);

		logger.info("Attempting to claim lock on Job", { jobId: jobIdStr });

		// Atomically find the job AND change its status from pending to processing
		const job = await Job.findOneAndUpdate(
			{ _id: jobIdStr, status: "pending" },
			{ $set: { status: JOB_STATUS_PROCESSING } },
			{ new: true },
		);

		if (!job) {
			logger.warn("Job not found or already processed/failed", {
				jobId: jobIdStr,
			});
			return;
		}

		logger.info("Successfully locked Job. Starting generation.", {
			jobId: jobIdStr,
			requestCount: job.requests.length,
		});

		const generatedBase64s: string[] = [];
		const errors: Error[] = [];

		for (let i = 0; i < job.requests.length; i++) {
			const currentRequest = job.requests[i] as unknown as ImageParams;
			const startTime = performance.now();

			try {
				const pngBuffer = await generatePNG(currentRequest);
				const duration = Math.round(performance.now() - startTime);

				const base64Data = `data:image/png;base64,${pngBuffer.toString("base64")}`;
				generatedBase64s.push(base64Data);

				// Capture individual Success Metrics
				try {
					const contrastRatio = getContrastRatio(
						currentRequest.backgroundColor || "#FFFFFF",
						currentRequest.textColor || "#000000",
					);
					await storeMetricsToMongoDB(
						buildMetricPayload(METRIC_STATUS_SUCCESS, {
							duration,
							size: {
								width: currentRequest.width,
								height: currentRequest.height,
							},
							font: currentRequest.font,
							titleLength: currentRequest.title?.length || 0,
							subtitleLength: currentRequest.subtitle?.length || 0,
							contrastRatio: contrastRatio ?? undefined,
							wcagLevel:
								contrastRatio !== null
									? getWCAGLevelFromRatio(contrastRatio)
									: undefined,
						}),
						context,
					);
				} catch (mErr) {
					logger.warn(`Failed to store success metric for image index ${i}`, {
						error: mErr,
					});
				}
			} catch (err) {
				const duration = Math.round(performance.now() - startTime);
				logger.error(
					`Failed to generate image index ${i} for job ${jobIdStr}`,
					err,
				);

				generatedBase64s.push(
					`error: ${err instanceof Error ? err.message : "Failed to render"}`,
				);
				errors.push(err instanceof Error ? err : new Error(String(err)));

				// Capture individual Error Metrics
				try {
					const contrastRatio = getContrastRatio(
						currentRequest.backgroundColor || "#FFFFFF",
						currentRequest.textColor || "#000000",
					);
					await storeMetricsToMongoDB(
						buildMetricPayload(METRIC_STATUS_ERROR, {
							duration,
							size: {
								width: currentRequest.width,
								height: currentRequest.height,
							},
							font: currentRequest.font,
							titleLength: currentRequest.title?.length || 0,
							subtitleLength: currentRequest.subtitle?.length || 0,
							contrastRatio: contrastRatio ?? undefined,
							wcagLevel:
								contrastRatio !== null
									? getWCAGLevelFromRatio(contrastRatio)
									: undefined,
							errorMessage: err instanceof Error ? err.message : String(err),
						}),
						context,
					);
				} catch (mErr) {
					logger.warn(`Failed to store error metric for image index ${i}`, {
						error: mErr,
					});
				}
			}
		}

		const hasFatalErrors = errors.length === job.requests.length;

		await Job.findByIdAndUpdate(jobIdStr, {
			$set: {
				status: hasFatalErrors ? JOB_STATUS_FAILED : JOB_STATUS_COMPLETED,
				results: generatedBase64s,
				error: hasFatalErrors ? "All images failed to generate." : undefined,
			},
		});

		logger.info("Batch job finished", {
			jobId: jobIdStr,
			processed: job.requests.length,
			errors: errors.length,
		});
	} catch (globalError: unknown) {
		logger.error("CRITICAL ERROR processing queue", globalError);

		try {
			const Job = getJobModel();
			const jobIdStr = String(queueItem);
			await Job.findByIdAndUpdate(jobIdStr, {
				$set: {
					status: JOB_STATUS_FAILED,
					error:
						globalError instanceof Error
							? globalError.message
							: "Crash during worker execution.",
				},
			});
		} catch (dbErr) {
			logger.error("Failed to write critical error recovery to DB", dbErr);
		}
	}
}

app.storageQueue("processJobs", {
	queueName: "batch-jobs",
	connection: "AzureWebJobsStorage",
	handler: processJobs,
});
