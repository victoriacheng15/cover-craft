import path from "node:path";
import {
	app,
	type HttpRequest,
	type HttpResponseInit,
	type InvocationContext,
} from "@azure/functions";
import { Canvas, registerFont } from "canvas";

// Validation constants
const SIZE_RANGE = { min: 1, max: 1200 };
const ALLOWED_FONTS = [
	"Montserrat",
	"Roboto",
	"Lato",
	"Playfair Display",
	"Open Sans",
];
const MAX_TITLE_LENGTH = 55;
const MAX_SUBTITLE_LENGTH = 120;
const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
const WCAG_AA_CONTRAST_RATIO = 4.5;

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
	filename: string;
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

// Contrast utility functions for WCAG validation
function hexToRgb(hex: string): { r: number; g: number; b: number } {
	const cleaned = hex.replace("#", "");
	const expanded =
		cleaned.length === 3
			? cleaned
					.split("")
					.map((c) => c + c)
					.join("")
			: cleaned;

	const num = parseInt(expanded, 16);
	return {
		r: (num >> 16) & 255,
		g: (num >> 8) & 255,
		b: num & 255,
	};
}

function getRelativeLuminance(rgb: {
	r: number;
	g: number;
	b: number;
}): number {
	const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
		const normalized = c / 255;
		return normalized <= 0.03928
			? normalized / 12.92
			: ((normalized + 0.055) / 1.055) ** 2.4;
	});

	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
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

// Modular validation functions for each parameter type
function validateSize(
	width: number | undefined,
	height: number | undefined,
): ValidationError[] {
	const errors: ValidationError[] = [];

	if (
		width === undefined ||
		!Number.isInteger(width) ||
		Number.isNaN(width) ||
		width < SIZE_RANGE.min ||
		width > SIZE_RANGE.max
	) {
		errors.push({
			field: "width",
			message: `Width must be an integer between ${SIZE_RANGE.min} and ${SIZE_RANGE.max}`,
		});
	}

	if (
		height === undefined ||
		!Number.isInteger(height) ||
		Number.isNaN(height) ||
		height < SIZE_RANGE.min ||
		height > SIZE_RANGE.max
	) {
		errors.push({
			field: "height",
			message: `Height must be an integer between ${SIZE_RANGE.min} and ${SIZE_RANGE.max}`,
		});
	}

	return errors;
}

function validateColors(
	backgroundColor: string,
	textColor: string,
): ValidationError[] {
	const errors: ValidationError[] = [];

	if (!HEX_COLOR_REGEX.test(backgroundColor)) {
		errors.push({
			field: "backgroundColor",
			message: "backgroundColor must be a valid hex color (e.g., #ffffff)",
		});
	}

	if (!HEX_COLOR_REGEX.test(textColor)) {
		errors.push({
			field: "textColor",
			message: "textColor must be a valid hex color (e.g., #000000)",
		});
	}

	return errors;
}

function validateFont(font: string): ValidationError[] {
	const errors: ValidationError[] = [];

	if (!ALLOWED_FONTS.includes(font)) {
		errors.push({
			field: "font",
			message: `font must be one of: ${ALLOWED_FONTS.join(", ")}`,
		});
	}

	return errors;
}

function validateTextLength(
	title: string,
	subtitle?: string,
): ValidationError[] {
	const errors: ValidationError[] = [];

	if (title && title.length > MAX_TITLE_LENGTH) {
		errors.push({
			field: "title",
			message: `title must be ${MAX_TITLE_LENGTH} characters or less`,
		});
	}

	if (subtitle && subtitle.length > MAX_SUBTITLE_LENGTH) {
		errors.push({
			field: "subtitle",
			message: `subtitle must be ${MAX_SUBTITLE_LENGTH} characters or less`,
		});
	}

	return errors;
}

function validateFilename(filename: string): ValidationError[] {
	const errors: ValidationError[] = [];

	if (!filename || filename.trim().length === 0) {
		errors.push({
			field: "filename",
			message: "filename is required and cannot be empty",
		});
	}

	return errors;
}

function validateContrast(
	backgroundColor: string,
	textColor: string,
): ValidationError[] {
	const errors: ValidationError[] = [];

	const ratio = getContrastRatio(backgroundColor, textColor);

	if (ratio < WCAG_AA_CONTRAST_RATIO) {
		errors.push({
			field: "contrast",
			message: `Color contrast ratio ${ratio.toFixed(2)}:1 does not meet WCAG AA standard (4.5:1). Please choose colors with better contrast.`,
		});
	}

	return errors;
}

// Main validation function that composes all validators
function validateParams(params: ImageParams): ValidationError[] {
	const errors: ValidationError[] = [];

	errors.push(...validateSize(params.width, params.height));
	errors.push(...validateColors(params.backgroundColor, params.textColor));
	errors.push(...validateFont(params.font));
	errors.push(...validateTextLength(params.title, params.subtitle));
	errors.push(...validateFilename(params.filename));
	errors.push(...validateContrast(params.backgroundColor, params.textColor));

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
			title: extractedParams.title as string,
			subtitle: extractedParams.subtitle as string,
			filename: extractedParams.filename as string,
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
				"Content-Disposition": `attachment; filename="${params.filename}-${Date.now()}.png"`,
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
