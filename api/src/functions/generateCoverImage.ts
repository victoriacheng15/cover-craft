import path from "node:path";
import { performance } from "node:perf_hooks";
import {
	app,
	type HttpRequest,
	type HttpResponseInit,
	type InvocationContext,
} from "@azure/functions";
import { Canvas, registerFont } from "canvas";
import { connectMongoDB, getMetricModel } from "../lib/mongoose";
import {
	IMAGE_GENERATED_EVENT,
	type MetricPayload,
} from "../shared/metricPayload";
import {
	generateFilename,
	getRelativeLuminance,
	getWCAGLevelFromRatio,
	hexToRgb,
	validateColors,
	validateContrast,
	validateFont,
	validateSize,
	validateTextLength,
} from "../shared/validators";

// Register fonts
const fontDir = path.join(__dirname, "../assets/fonts");
registerFont(path.join(fontDir, "Montserrat-Regular.ttf"), {
	family: "Montserrat",
});
registerFont(path.join(fontDir, "Montserrat-Bold.ttf"), {
	family: "Montserrat",
	weight: "bold",
});
registerFont(path.join(fontDir, "Roboto-Regular.ttf"), { family: "Roboto" });
registerFont(path.join(fontDir, "Roboto-Bold.ttf"), {
	family: "Roboto",
	weight: "bold",
});
registerFont(path.join(fontDir, "Lato-Regular.ttf"), { family: "Lato" });
registerFont(path.join(fontDir, "Lato-Bold.ttf"), {
	family: "Lato",
	weight: "bold",
});
registerFont(path.join(fontDir, "PlayfairDisplay-Regular.ttf"), {
	family: "Playfair Display",
});
registerFont(path.join(fontDir, "PlayfairDisplay-Bold.ttf"), {
	family: "Playfair Display",
	weight: "bold",
});
registerFont(path.join(fontDir, "OpenSans-Regular.ttf"), {
	family: "Open Sans",
});
registerFont(path.join(fontDir, "OpenSans-Bold.ttf"), {
	family: "Open Sans",
	weight: "bold",
});

interface ImageParams {
	width: number;
	height: number;
	backgroundColor: string;
	textColor: string;
	font: string;
	title: string;
	subtitle?: string;
	filename?: string;
}

interface ValidationError {
	field: string;
	message: string;
}

// Extract parameters from query and body
async function extractParams(
	request: HttpRequest,
): Promise<Partial<ImageParams>> {
	const params: Partial<ImageParams> = {};

	// Get query parameters
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
			// Log for observability - can be monitored later via Application Insights
			// Fall back to query params and let validation catch missing parameters
		} else {
			// Re-throw text() or other unexpected errors
			throw error;
		}
	}

	// Query params take precedence over body
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

function getContrastRatio(color1: string, color2: string): number {
	const rgb1 = hexToRgb(color1);
	const rgb2 = hexToRgb(color2);

	const lum1 = getRelativeLuminance(rgb1);
	const lum2 = getRelativeLuminance(rgb2);

	const lighter = Math.max(lum1, lum2);
	const darker = Math.min(lum1, lum2);

	return (lighter + 0.05) / (darker + 0.05);
}

// Main validation function that composes all validators
function validateParams(params: ImageParams): ValidationError[] {
	const errors: ValidationError[] = [];

	errors.push(...validateSize(params.width, params.height));
	errors.push(...validateColors(params.backgroundColor, params.textColor));
	errors.push(...validateFont(params.font));
	errors.push(...validateTextLength(params.title, params.subtitle));
	errors.push(...validateContrast(params.backgroundColor, params.textColor));

	return errors;
}

// Helper function to persist metrics consistently across all paths
async function persistMetric(
	context: InvocationContext,
	metricData: Partial<MetricPayload>,
): Promise<void> {
	try {
		await connectMongoDB(context);
		const Metric = getMetricModel();

		const metric = new Metric({
			event: IMAGE_GENERATED_EVENT,
			timestamp: new Date().toISOString(),
			status: metricData.status,
			...metricData,
		});

		await metric.save();
		context.log(`Saved ${metricData.status} metric`, metric._id?.toString());
	} catch (err) {
		context.error(
			`Failed to persist ${metricData.status} metric for image_generated:`,
			err,
		);
	}
}

// Generate PNG image
async function generatePNG(params: ImageParams): Promise<Buffer> {
	const canvas = new Canvas(params.width, params.height);
	const ctx = canvas.getContext("2d");

	// Draw background
	ctx.fillStyle = params.backgroundColor;
	ctx.fillRect(0, 0, params.width, params.height);

	// Calculate text positioning based on canvas dimensions
	const padding = 40;
	const maxTextWidth = params.width - padding * 2;
	const centerX = params.width / 2;
	const centerY = params.height / 2;

	// Calculate font sizes based on canvas height for responsiveness
	// Solution #2: 9% heading (min 32px) and 7% subheading (min 24px) for better readability
	const headingFontSize = Math.max(32, Math.round(params.height * 0.09)); // 9% of height
	const subheadingFontSize = Math.max(24, Math.round(params.height * 0.07)); // 7% of height
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
	// Declare startTime here so it's in scope for catch block as well
	let startTime: number | undefined;
	// keep a reference to extractedParams in outer scope so we can persist metrics on errors
	let extractedParams: Partial<ImageParams> | undefined;

	try {
		// Extract parameters
		extractedParams = await extractParams(request);

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
		const validationErrors = validateParams(params);
		if (validationErrors.length > 0) {
			// Persist a minimal validation_error metric for observability, but do not block response on DB errors
			const validationMessage = validationErrors
				.map((e) => `${e.field}: ${e.message}`)
				.join("; ");

			const contrastRatioResult = getContrastRatio(
				params.backgroundColor,
				params.textColor,
			);
			await persistMetric(context, {
				status: "validation_error",
				size: {
					width: params.width,
					height: params.height,
				},
				font: params.font,
				titleLength: params.title.length,
				subtitleLength: params.subtitle?.length,
				contrastRatio: contrastRatioResult,
				wcagLevel: getWCAGLevelFromRatio(contrastRatioResult),
				errorMessage: (validationMessage || "validation failed").slice(0, 1000),
			});

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

		// Persist metric to MongoDB (does not block response beyond write time)
		const contrastRatioResult = getContrastRatio(
			params.backgroundColor,
			params.textColor,
		);
		await persistMetric(context, {
			status: "success",
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
		});

		// Return response with PNG
		return {
			status: 200,
			headers,
			body: pngBuffer,
		};
	} catch (error) {
		context.error(`Error generating cover image: ${error}`);
		// compute partial duration, if applicable
		let partialDuration: number | undefined;
		try {
			if (typeof startTime === "number") {
				partialDuration = Math.round(performance.now() - startTime);
			}
		} catch (_e) {
			// ignore
		}
		// Persist an error metric to MongoDB, if possible
		const contrastRatioResult = getContrastRatio(
			extractedParams?.backgroundColor,
			extractedParams?.textColor,
		);
		await persistMetric(context, {
			status: "error",
			duration: partialDuration,
			size: {
				width: extractedParams?.width,
				height: extractedParams?.height,
			},
			font: extractedParams?.font,
			titleLength: extractedParams?.title?.length,
			subtitleLength: extractedParams?.subtitle?.length,
			contrastRatio: contrastRatioResult,
			wcagLevel: getWCAGLevelFromRatio(contrastRatioResult),
			errorMessage: error instanceof Error ? error.message : String(error),
		});
		// Include partial duration header if available
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
