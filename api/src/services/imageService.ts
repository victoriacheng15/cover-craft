import type { ImageParams } from "@cover-craft/shared";
import { Canvas } from "canvas";
import { IMAGE_CONFIG } from "../config/imageConfig";

// Generate PNG image
export async function generatePNG(params: ImageParams): Promise<Buffer> {
	const canvas = new Canvas(params.width, params.height);
	const ctx = canvas.getContext("2d");

	if (!ctx) {
		throw new Error("Failed to get 2d context from canvas");
	}

	try {
		// Draw background
		ctx.fillStyle = params.backgroundColor;
		ctx.fillRect(0, 0, params.width, params.height);

		// Calculate text positioning based on canvas dimensions
		const padding = IMAGE_CONFIG.dimensions.padding;
		const maxTextWidth = params.width - padding * 2;
		const centerX = params.width / 2;
		const centerY = params.height / 2;

		// Calculate font sizes based on the larger dimension
		const scaleBase = Math.max(params.width, params.height);
		const headingFontSize = Math.max(
			IMAGE_CONFIG.typography.headingMinSize,
			Math.round(scaleBase * IMAGE_CONFIG.typography.headingPercentage),
		);
		const subheadingFontSize = Math.max(
			IMAGE_CONFIG.typography.subheadingMinSize,
			Math.round(scaleBase * IMAGE_CONFIG.typography.subheadingPercentage),
		);
		const lineSpacing =
			headingFontSize * IMAGE_CONFIG.typography.lineSpacingMultiplier;

		// Draw heading with bold font weight
		ctx.fillStyle = params.textColor;
		ctx.font = `bold ${headingFontSize}px "${params.font}"`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";

		// If subtitle exists, position title above center; otherwise, center vertically
		const headingY = params.subtitle ? centerY - lineSpacing / 2 : centerY;
		ctx.fillText(params.title, centerX, headingY, maxTextWidth);

		// Draw subheading with regular font weight
		if (params.subtitle) {
			ctx.font = `normal ${subheadingFontSize}px "${params.font}"`;
			ctx.fillStyle = params.textColor;
			const subheadingY = centerY + lineSpacing / 2;
			ctx.fillText(params.subtitle, centerX, subheadingY, maxTextWidth);
		}

		// Convert canvas to PNG buffer
		return canvas.toBuffer("image/png");
	} catch (error) {
		throw new Error(
			`Canvas manipulation failed: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}
