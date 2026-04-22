import { performance } from "node:perf_hooks";
import { app, type InvocationContext } from "@azure/functions";
import {
	getContrastRatio,
	getWCAGLevelFromRatio,
	type ImageParams,
	JOB_STATUS_COMPLETED,
	JOB_STATUS_FAILED,
	JOB_STATUS_PENDING,
	JOB_STATUS_PROCESSING,
	METRIC_STATUS_ERROR,
	METRIC_STATUS_SUCCESS,
} from "@cover-craft/shared";
import { createLogger } from "../lib/logger";
import {
	connectMongoDB,
	getJobModel,
	type JobDocument,
	type JobResult,
} from "../lib/mongoose";
import { generatePNG } from "../services/imageService";
import { buildMetricPayload, storeMetricsToMongoDB } from "./metrics";

const DEFAULT_MAX_JOB_ATTEMPTS = 3;
const MAX_IMAGE_ATTEMPTS = 3;
const PROCESSING_TIMEOUT_MS = 5 * 60 * 1000;
const JOB_RETRY_VISIBILITY_TIMEOUT_SECONDS = 30;
const IMAGE_RETRY_BASE_DELAY_MS = 250;
const IMAGE_RETRY_JITTER_MS = 100;

function getJobResultMap(job: JobDocument): Record<string, JobResult> {
	return job.resultDetails ?? {};
}

function publicResultFromDetail(detail: JobResult): string {
	if (detail.status === "success" && detail.dataUrl) {
		return detail.dataUrl;
	}

	return `error: ${detail.error || "Failed to render"}`;
}

function buildPublicResults(
	resultDetails: Record<string, JobResult>,
	total: number,
): string[] {
	const publicResults: string[] = [];

	for (let i = 0; i < total; i++) {
		const detail = resultDetails[String(i)];
		if (detail) {
			publicResults[i] = publicResultFromDetail(detail);
		}
	}

	return publicResults;
}

function countFinalResults(resultDetails: Record<string, JobResult>): number {
	return Object.keys(resultDetails).length;
}

function hasSuccessfulResult(
	resultDetails: Record<string, JobResult>,
): boolean {
	return Object.values(resultDetails).some(
		(detail) => detail.status === "success",
	);
}

function getErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

function getRetryDelay(attempt: number): number {
	const exponentialDelay =
		IMAGE_RETRY_BASE_DELAY_MS * 2 ** Math.max(0, attempt - 1);
	const jitter = Math.floor(Math.random() * (IMAGE_RETRY_JITTER_MS + 1));
	return exponentialDelay + jitter;
}

async function wait(ms: number): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, ms));
}

async function enqueueJobRetry(jobId: string): Promise<void> {
	const storageConnectionString = process.env.AzureWebJobsStorage;
	if (!storageConnectionString) {
		return;
	}

	const { QueueClient } = await import("@azure/storage-queue");
	const queueClient = new QueueClient(storageConnectionString, "batch-jobs");
	await queueClient.createIfNotExists();
	const base64Message = Buffer.from(jobId).toString("base64");
	await queueClient.sendMessage(base64Message, {
		visibilityTimeout: JOB_RETRY_VISIBILITY_TIMEOUT_SECONDS,
	});
}

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

		const staleBefore = new Date(Date.now() - PROCESSING_TIMEOUT_MS);
		const claimableAttempts = [
			{ attempts: { $exists: false } },
			{ attempts: { $lt: DEFAULT_MAX_JOB_ATTEMPTS } },
		];

		// Atomically claim a new job or reclaim a stale processing job.
		const job = await Job.findOneAndUpdate(
			{
				_id: jobIdStr,
				$or: [
					{ status: JOB_STATUS_PENDING, $or: claimableAttempts },
					{
						status: JOB_STATUS_PROCESSING,
						processingStartedAt: { $lt: staleBefore },
						$or: claimableAttempts,
					},
				],
			},
			{
				$set: {
					status: JOB_STATUS_PROCESSING,
					processingStartedAt: new Date(),
					maxAttempts: DEFAULT_MAX_JOB_ATTEMPTS,
				},
				$inc: { attempts: 1 },
			},
			{ new: true },
		);

		if (!job) {
			const existingJob = await Job.findById(jobIdStr);
			if (
				existingJob &&
				existingJob.status !== JOB_STATUS_COMPLETED &&
				existingJob.status !== JOB_STATUS_FAILED &&
				(existingJob.attempts ?? 0) >=
					(existingJob.maxAttempts ?? DEFAULT_MAX_JOB_ATTEMPTS)
			) {
				await Job.findByIdAndUpdate(jobIdStr, {
					$set: {
						status: JOB_STATUS_FAILED,
						error: "Job exceeded maximum processing attempts.",
						lastError: "Job exceeded maximum processing attempts.",
					},
					$unset: { processingStartedAt: "" },
				});
			}

			logger.warn("Job not found, already finalized, or actively processing", {
				jobId: jobIdStr,
			});
			return;
		}

		logger.info("Successfully locked Job. Starting generation.", {
			jobId: jobIdStr,
			requestCount: job.requests.length,
		});

		const resultDetails = { ...getJobResultMap(job) };

		for (let i = 0; i < job.requests.length; i++) {
			if (resultDetails[String(i)]) {
				logger.info("Skipping already finalized image result", {
					jobId: jobIdStr,
					index: i,
				});
				continue;
			}

			const currentRequest = job.requests[i] as unknown as ImageParams;
			const startTime = performance.now();
			let lastError: unknown;
			let detail: JobResult | null = null;

			for (let attempt = 1; attempt <= MAX_IMAGE_ATTEMPTS; attempt++) {
				try {
					const pngBuffer = await generatePNG(currentRequest);
					const duration = Math.round(performance.now() - startTime);

					const base64Data = `data:image/png;base64,${pngBuffer.toString("base64")}`;
					detail = {
						index: i,
						status: "success",
						dataUrl: base64Data,
						attempts: attempt,
						updatedAt: new Date(),
					};

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
					break;
				} catch (err) {
					lastError = err;
					logger.warn("Image render attempt failed", {
						jobId: jobIdStr,
						index: i,
						attempt,
						error: getErrorMessage(err),
					});

					if (attempt < MAX_IMAGE_ATTEMPTS) {
						await wait(getRetryDelay(attempt));
					}
				}
			}

			if (!detail) {
				const duration = Math.round(performance.now() - startTime);
				const errorMessage = lastError
					? getErrorMessage(lastError)
					: "Failed to render";
				detail = {
					index: i,
					status: "error",
					error: errorMessage,
					attempts: MAX_IMAGE_ATTEMPTS,
					updatedAt: new Date(),
				};

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
							errorMessage,
						}),
						context,
					);
				} catch (mErr) {
					logger.warn(`Failed to store error metric for image index ${i}`, {
						error: mErr,
					});
				}
			}

			resultDetails[String(i)] = detail;
			await Job.findByIdAndUpdate(jobIdStr, {
				$set: {
					[`resultDetails.${i}`]: detail,
					[`results.${i}`]: publicResultFromDetail(detail),
					...(detail.status === "error" ? { lastError: detail.error } : {}),
				},
			});
		}

		const processedCount = countFinalResults(resultDetails);
		const allImagesFinal = processedCount === job.requests.length;
		const hasSuccess = hasSuccessfulResult(resultDetails);
		const finalStatus =
			allImagesFinal && hasSuccess ? JOB_STATUS_COMPLETED : JOB_STATUS_FAILED;
		const finalError = hasSuccess
			? undefined
			: "All images failed to generate.";

		await Job.findByIdAndUpdate(jobIdStr, {
			$set: {
				status: finalStatus,
				results: buildPublicResults(resultDetails, job.requests.length),
				...(finalError ? { error: finalError } : {}),
				...(finalError ? { lastError: finalError } : {}),
			},
			$unset: {
				processingStartedAt: "",
				...(finalError ? {} : { error: "", lastError: "" }),
			},
		});

		logger.info("Batch job finished", {
			jobId: jobIdStr,
			processed: processedCount,
			errors: Object.values(resultDetails).filter(
				(detail) => detail.status === "error",
			).length,
		});
	} catch (globalError: unknown) {
		logger.error("CRITICAL ERROR processing queue", globalError);

		try {
			const Job = getJobModel();
			const jobIdStr = String(queueItem);
			const existingJob = await Job.findById(jobIdStr);
			const maxAttempts = existingJob?.maxAttempts ?? DEFAULT_MAX_JOB_ATTEMPTS;
			const attempts = existingJob?.attempts ?? maxAttempts;
			const errorMessage = getErrorMessage(globalError);

			if (attempts < maxAttempts) {
				await Job.findByIdAndUpdate(jobIdStr, {
					$set: {
						status: JOB_STATUS_PENDING,
						lastError: errorMessage,
					},
					$unset: { processingStartedAt: "" },
				});
				await enqueueJobRetry(jobIdStr);
				return;
			}

			await Job.findByIdAndUpdate(jobIdStr, {
				$set: {
					status: JOB_STATUS_FAILED,
					error: errorMessage || "Crash during worker execution.",
					lastError: errorMessage || "Crash during worker execution.",
				},
				$unset: { processingStartedAt: "" },
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
