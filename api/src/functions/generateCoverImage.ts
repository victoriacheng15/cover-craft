import path from "node:path";
import { performance } from "node:perf_hooks";
import {
	app,
	type HttpRequest,
	type HttpResponseInit,
	type InvocationContext,
} from "@azure/functions";
import {
	generateFilename,
	getContrastRatio,
	getWCAGLevelFromRatio,
	type ImageParams,
	METRIC_STATUS_ERROR,
	METRIC_STATUS_SUCCESS,
	METRIC_STATUS_VALIDATION_ERROR,
	validateImageParams,
} from "@cover-craft/shared";
import { registerFont } from "canvas";
import { FONT_CONFIG } from "../lib/fontConfig";
import { createLogger } from "../lib/logger";
import { generatePNG } from "../services/imageService";
import { extractParams } from "../utils/params";
import { buildMetricPayload, storeMetricsToMongoDB } from "./metrics";

// Register fonts
const fontDir = path.join(__dirname, "../assets/fonts");

// Iterate over configuration to register fonts
for (const font of FONT_CONFIG) {
	try {
		const fontPath = path.join(fontDir, font.file);
		registerFont(fontPath, {
			family: font.family,
			weight: font.weight,
		});
	} catch (error) {
		// Log error but allow process to continue (resilience)
		// In a real production system, we might want to alert on this
		console.error(
			`Failed to register font ${font.family} (${font.file}):`,
			error,
		);
	}
}

export async function generateCoverImage(
	request: HttpRequest,
	context: InvocationContext,
): Promise<HttpResponseInit> {
	const logger = createLogger(context);
	logger.info("generateCoverImage function triggered");

	let startTime: number | undefined;
	let extractedParams: Partial<ImageParams> | undefined;

	try {
		extractedParams = await extractParams(request, logger);

		// All parameters are required - no defaults
		const params: ImageParams = {
			width: extractedParams.width as number,
			height: extractedParams.height as number,
			backgroundColor: extractedParams.backgroundColor as string,
			textColor: extractedParams.textColor as string,
			font: extractedParams.font as string,
			title: extractedParams.title as string,
			subtitle: extractedParams.subtitle,
			filename: generateFilename(extractedParams.filename),
		};

		// Validate parameters
		const validationErrors = validateImageParams(params);
		if (validationErrors.length > 0) {
			const validationMessage = validationErrors
				.map((e) => `${e.field}: ${e.message}`)
				.join("; ");

			logger.warn("Validation failed for image generation parameters", {
				details: validationErrors,
				params,
			});

			const contrastRatioResult = getContrastRatio(
				params.backgroundColor,
				params.textColor,
			);

			try {
				await storeMetricsToMongoDB(
					buildMetricPayload(METRIC_STATUS_VALIDATION_ERROR, {
						size: {
							width: params.width,
							height: params.height,
						},
						font: params.font,
						titleLength: params.title.length,
						subtitleLength: params.subtitle?.length,
						contrastRatio: contrastRatioResult ?? undefined,
						wcagLevel:
							contrastRatioResult !== null
								? getWCAGLevelFromRatio(contrastRatioResult)
								: undefined,
						errorMessage: (validationMessage || "validation failed").slice(
							0,
							1000,
						),
					}),
					context,
				);
			} catch (err) {
				logger.error("Failed to store validation_error metric:", err, {
					params,
					validationErrors,
				});
			}

			return {
				status: 400,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					error: "Validation failed",
					details: validationErrors,
				}),
			};
		}

		// Start server-side timing
		startTime = performance.now();

		// Generate PNG
		const pngBuffer = await generatePNG(params);

		// Calculate generation duration
		const duration = Math.round(performance.now() - startTime);

		// Build headers including Server-Timing and fallback X-Generation-Duration
		const headers: Record<string, string> = {
			"Content-Type": "image/png",
			"Content-Disposition": `attachment; filename="${params.filename}-${Date.now()}.png"`,
			"Cache-Control": "no-cache, no-store, must-revalidate",
			"Server-Timing": `generation;dur=${duration}`,
			"X-Generation-Duration": String(duration),
		};

		const contrastRatioResult = getContrastRatio(
			params.backgroundColor,
			params.textColor,
		);
		try {
			await storeMetricsToMongoDB(
				buildMetricPayload(METRIC_STATUS_SUCCESS, {
					duration,
					size: {
						width: params.width,
						height: params.height,
					},
					font: params.font,
					titleLength: params.title.length,
					subtitleLength: params.subtitle?.length,
					contrastRatio: contrastRatioResult ?? undefined,
					wcagLevel:
						contrastRatioResult !== null
							? getWCAGLevelFromRatio(contrastRatioResult)
							: undefined,
				}),
				context,
			);
			logger.info("Image generated successfully and metric stored.", {
				params,
				duration,
			});
		} catch (err) {
			logger.error("Failed to store success metric:", err, { params });
		}

		return {
			status: 200,
			headers,
			body: new Uint8Array(pngBuffer),
		};
	} catch (error) {
		logger.error("Error generating cover image:", error, {
			extractedParams,
			startTime,
		});

		let partialDuration: number | undefined;
		try {
			if (typeof startTime === "number") {
				partialDuration = Math.round(performance.now() - startTime);
			}
		} catch (_e) {
			logger.error("Failed to calculate partial duration after error.", _e);
		}

		const contrastRatioResult = getContrastRatio(
			extractedParams?.backgroundColor || "#FFFFFF",
			extractedParams?.textColor || "#000000",
		);

		try {
			await storeMetricsToMongoDB(
				buildMetricPayload(METRIC_STATUS_ERROR, {
					duration: partialDuration,
					size:
						extractedParams?.width !== undefined &&
						extractedParams?.height !== undefined
							? {
									width: extractedParams.width,
									height: extractedParams.height,
								}
							: undefined,
					font: extractedParams?.font,
					titleLength: extractedParams?.title?.length,
					subtitleLength: extractedParams?.subtitle?.length,
					contrastRatio: contrastRatioResult ?? undefined,
					wcagLevel:
						contrastRatioResult !== null
							? getWCAGLevelFromRatio(contrastRatioResult)
							: undefined,
					errorMessage: error instanceof Error ? error.message : String(error),
				}),
				context,
			);
		} catch (err) {
			logger.error(
				"Failed to store error metric after generation error:",
				err,
				{
					originalError: error,
					extractedParams,
				},
			);
		}

		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};
		if (partialDuration !== undefined) {
			headers["X-Generation-Duration"] = String(partialDuration);
			headers["Server-Timing"] = `generation;dur=${partialDuration}`;
		}
		return {
			status: 500,
			headers,
			body: JSON.stringify({
				error: "Internal server error",
				message: error instanceof Error ? error.message : "Unknown error",
			}),
		};
	}
}

app.http("generateCoverImage", {
	methods: ["GET", "POST"],
	authLevel: "anonymous",
	handler: generateCoverImage,
});
