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
	getRelativeLuminance,
	getWCAGLevelFromRatio,
	hexToRgb,
	IMAGE_GENERATED_EVENT,
	type ImageParams,
	METRIC_STATUS_ERROR,
	METRIC_STATUS_SUCCESS,
	METRIC_STATUS_VALIDATION_ERROR,
	type MetricPayload,
	validateImageParams,
} from "@cover-craft/shared";
import { Canvas, registerFont } from "canvas";
import { FONT_CONFIG } from "../lib/fontConfig";
import { createLogger } from "../lib/logger";
import { storeMetricsToMongoDB } from "./metrics";

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

// Extract parameters from query and body
async function extractParams(
	request: HttpRequest,
	logger: ReturnType<typeof createLogger>,
): Promise<Partial<ImageParams>> {
	const params: Partial<ImageParams> = {};

	const queryWidth = request.query.get("width");
	const queryHeight = request.query.get("height");
	const queryBgColor = request.query.get("backgroundColor");
	const queryTextColor = request.query.get("textColor");
	const queryFont = request.query.get("font");
	const queryTitle = request.query.get("title");
	const querySubtitle = request.query.get("subtitle");
	const queryFilename = request.query.get("filename");

	// Try to parse body
	let bodyParams: Partial<ImageParams> = {};
	try {
		const bodyText = await request.text();
		if (bodyText) {
			bodyParams = JSON.parse(bodyText);
		}
	} catch (error) {
		// Only ignore JSON parse errors, not text() errors
		if (error instanceof SyntaxError) {
			logger.warn(
				"Request body contained invalid JSON, falling back to query parameters.",
				{ error },
			);
		} else {
			// Re-throw text() or other unexpected errors
			logger.error("Error reading request body:", error);
			throw error;
		}
	}

	if (queryWidth != null) {
		params.width = Number(queryWidth);
	} else {
		params.width = bodyParams.width;
	}

	if (queryHeight != null) {
		params.height = Number(queryHeight);
	} else {
		params.height = bodyParams.height;
	}

	params.backgroundColor = queryBgColor || bodyParams.backgroundColor;
	params.textColor = queryTextColor || bodyParams.textColor;
	params.font = queryFont || bodyParams.font;
	params.title = queryTitle || bodyParams.title;
	params.subtitle = querySubtitle || bodyParams.subtitle;
	params.filename = queryFilename || bodyParams.filename;

	return params;
}

function getContrastRatio(color1?: string, color2?: string): number {
	if (!color1 || !color2) return 1; // Default to 1:1 ratio if colors missing

	const rgb1 = hexToRgb(color1);
	const rgb2 = hexToRgb(color2);

	if (!rgb1 || !rgb2) return 1;

	const lum1 = getRelativeLuminance(rgb1);
	const lum2 = getRelativeLuminance(rgb2);

	const lighter = Math.max(lum1, lum2);
	const darker = Math.min(lum1, lum2);

	return (lighter + 0.05) / (darker + 0.05);
}

function buildMetricPayload(
	status: MetricPayload["status"],
	metricsData: Omit<MetricPayload, "event" | "timestamp" | "status">,
): MetricPayload {
	return {
		event: IMAGE_GENERATED_EVENT,
		timestamp: new Date().toISOString(),
		status,
		...metricsData,
	};
}

// Generate PNG image
async function generatePNG(params: ImageParams): Promise<Buffer> {
	const canvas = new Canvas(params.width, params.height);
	const ctx = canvas.getContext("2d");

	if (!ctx) {
		throw new Error("Failed to get 2d context from canvas");
	}

	// Draw background
	ctx.fillStyle = params.backgroundColor;
	ctx.fillRect(0, 0, params.width, params.height);

	// Calculate text positioning based on canvas dimensions
	const padding = 40;
	const maxTextWidth = params.width - padding * 2;
	const centerX = params.width / 2;
	const centerY = params.height / 2;

	// Calculate font sizes based on the larger dimension for balanced scaling across aspect ratios
	// Solution #3: 7.5% heading (min 32px) and 5.5% subheading (min 24px) for better consistency
	const scaleBase = Math.max(params.width, params.height);
	const headingFontSize = Math.max(32, Math.round(scaleBase * 0.075)); // 7.5% of max dimension
	const subheadingFontSize = Math.max(24, Math.round(scaleBase * 0.055)); // 5.5% of max dimension
	const lineSpacing = headingFontSize * 1.2; // Space between heading and subheading

	// Draw heading with bold font weight
	ctx.fillStyle = params.textColor;
	ctx.font = `bold ${headingFontSize}px "${params.font}"`;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	// If subtitle exists, position title above center; otherwise, center vertically
	const headingY = params.subtitle ? centerY - lineSpacing / 2 : centerY;
	ctx.fillText(params.title, centerX, headingY, maxTextWidth);

	// Draw subheading with regular font weight, positioned below heading (only if provided)
	if (params.subtitle) {
		ctx.font = `normal ${subheadingFontSize}px "${params.font}"`;
		ctx.fillStyle = params.textColor;
		const subheadingY = centerY + lineSpacing / 2;
		ctx.fillText(params.subtitle, centerX, subheadingY, maxTextWidth);
	}

	// Convert canvas to PNG buffer
	return canvas.toBuffer("image/png");
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
						contrastRatio: contrastRatioResult,
						wcagLevel: getWCAGLevelFromRatio(contrastRatioResult),
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
					contrastRatio: contrastRatioResult,
					wcagLevel: getWCAGLevelFromRatio(contrastRatioResult),
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
			extractedParams?.backgroundColor,
			extractedParams?.textColor,
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
					contrastRatio: contrastRatioResult,
					wcagLevel: getWCAGLevelFromRatio(contrastRatioResult),
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
