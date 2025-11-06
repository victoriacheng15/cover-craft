import {
	app,
	type HttpRequest,
	type HttpResponseInit,
	type InvocationContext,
} from "@azure/functions";
import { Canvas, registerFont } from "canvas";
import path from "path";

// Validation constants
const SIZE_RANGE = { min: 1, max: 1200 };
const ALLOWED_FONTS = ["Montserrat", "Roboto", "Lato", "Playfair Display", "Open Sans"];
const MAX_TITLE_LENGTH = 55;
const MAX_SUBTITLE_LENGTH = 120;
const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

// Register fonts
const fontDir = path.join(__dirname, "../assets/fonts");
registerFont(path.join(fontDir, "Montserrat-Regular.ttf"), { family: "Montserrat" });
registerFont(path.join(fontDir, "Montserrat-Bold.ttf"), { family: "Montserrat", weight: "bold" });
registerFont(path.join(fontDir, "Roboto-Regular.ttf"), { family: "Roboto" });
registerFont(path.join(fontDir, "Roboto-Bold.ttf"), { family: "Roboto", weight: "bold" });
registerFont(path.join(fontDir, "Lato-Regular.ttf"), { family: "Lato" });
registerFont(path.join(fontDir, "Lato-Bold.ttf"), { family: "Lato", weight: "bold" });
registerFont(path.join(fontDir, "PlayfairDisplay-Regular.ttf"), { family: "Playfair Display" });
registerFont(path.join(fontDir, "PlayfairDisplay-Bold.ttf"), { family: "Playfair Display", weight: "bold" });
registerFont(path.join(fontDir, "OpenSans-Regular.ttf"), { family: "Open Sans" });
registerFont(path.join(fontDir, "OpenSans-Bold.ttf"), { family: "Open Sans", weight: "bold" });

interface ImageParams {
	width: number;
	height: number;
	backgroundColor: string;
	textColor: string;
	font: string;
	heading: string;
	subheading: string;
	imageName: string;
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
	const queryHeading = request.query.get("heading");
	const querySubheading = request.query.get("subheading");
	const queryImageName = request.query.get("imageName");

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
	params.heading = queryHeading || bodyParams.heading;
	params.subheading = querySubheading || bodyParams.subheading;
	params.imageName = queryImageName || bodyParams.imageName;

	return params;
}

// Validate all parameters
function validateParams(params: ImageParams): ValidationError[] {
	const errors: ValidationError[] = [];

	// Validate width (always present due to defaults)
	if (
		params.width === undefined ||
		!Number.isInteger(params.width) ||
		Number.isNaN(params.width) ||
		params.width < SIZE_RANGE.min ||
		params.width > SIZE_RANGE.max
	) {
		errors.push({
			field: "width",
			message: `Width must be an integer between ${SIZE_RANGE.min} and ${SIZE_RANGE.max}`,
		});
	}

	// Validate height (always present due to defaults)
	if (
		params.height === undefined ||
		!Number.isInteger(params.height) ||
		Number.isNaN(params.height) ||
		params.height < SIZE_RANGE.min ||
		params.height > SIZE_RANGE.max
	) {
		errors.push({
			field: "height",
			message: `Height must be an integer between ${SIZE_RANGE.min} and ${SIZE_RANGE.max}`,
		});
	}

	// Validate backgroundColor (always present due to defaults)
	if (!HEX_COLOR_REGEX.test(params.backgroundColor)) {
		errors.push({
			field: "backgroundColor",
			message: "backgroundColor must be a valid hex color (e.g., #ffffff)",
		});
	}

	// Validate textColor (always present due to defaults)
	if (!HEX_COLOR_REGEX.test(params.textColor)) {
		errors.push({
			field: "textColor",
			message: "textColor must be a valid hex color (e.g., #000000)",
		});
	}

	// Validate font (always present due to defaults)
	if (!ALLOWED_FONTS.includes(params.font)) {
		errors.push({
			field: "font",
			message: `font must be one of: ${ALLOWED_FONTS.join(", ")}`,
		});
	}

	// Validate heading length
	if (params.heading && params.heading.length > MAX_TITLE_LENGTH) {
		errors.push({
			field: "heading",
			message: `heading must be ${MAX_TITLE_LENGTH} characters or less`,
		});
	}

	// Validate subheading length
	if (params.subheading && params.subheading.length > MAX_SUBTITLE_LENGTH) {
		errors.push({
			field: "subheading",
			message: `subheading must be ${MAX_SUBTITLE_LENGTH} characters or less`,
		});
	}

	// Validate imageName (required, non-empty)
	if (!params.imageName || params.imageName.trim().length === 0) {
		errors.push({
			field: "imageName",
			message: "imageName is required and cannot be empty",
		});
	}

	return errors;
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
	const headingFontSize = Math.max(30, Math.round(params.height * 0.08)); // 8% of height
	const subheadingFontSize = Math.max(20, Math.round(params.height * 0.06)); // 6% of height
	const lineSpacing = headingFontSize * 1.2; // Space between heading and subheading

	// Draw heading with bold font weight, positioned above center
	ctx.fillStyle = params.textColor;
	ctx.font = `bold ${headingFontSize}px "${params.font}"`;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	const headingY = centerY - lineSpacing / 2;
	ctx.fillText(params.heading, centerX, headingY, maxTextWidth);

	// Draw subheading with regular font weight, positioned below heading
	ctx.font = `normal ${subheadingFontSize}px "${params.font}"`;
	ctx.fillStyle = params.textColor;
	const subheadingY = centerY + lineSpacing / 2;
	ctx.fillText(params.subheading, centerX, subheadingY, maxTextWidth);

	// Convert canvas to PNG buffer
	return canvas.toBuffer("image/png");
}

export async function generateCoverImage(
	request: HttpRequest,
	context: InvocationContext,
): Promise<HttpResponseInit> {
	context.log(`Generating cover image for request: ${request.url}`);

	try {
		// Extract parameters
		const extractedParams = await extractParams(request);

		// All parameters are required - no defaults
		const params: ImageParams = {
			width: extractedParams.width as number,
			height: extractedParams.height as number,
			backgroundColor: extractedParams.backgroundColor as string,
			textColor: extractedParams.textColor as string,
			font: extractedParams.font as string,
			heading: extractedParams.heading as string,
			subheading: extractedParams.subheading as string,
			imageName: extractedParams.imageName as string,
		};

		// Validate parameters
		const validationErrors = validateParams(params);
		if (validationErrors.length > 0) {
			return {
				status: 400,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					error: "Validation failed",
					details: validationErrors,
				}),
			};
		}

		// Generate PNG
		const pngBuffer = await generatePNG(params);

		// Return response with PNG
		return {
			status: 200,
			headers: {
				"Content-Type": "image/png",
				"Content-Disposition": `attachment; filename="${params.imageName}-${Date.now()}.png"`,
				"Cache-Control": "no-cache, no-store, must-revalidate",
			},
			body: pngBuffer,
		};
	} catch (error) {
		context.error(`Error generating cover image: ${error}`);
		return {
			status: 500,
			headers: { "Content-Type": "application/json" },
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
