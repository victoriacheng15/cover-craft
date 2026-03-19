"use client";

import type { ImageParams } from "@cover-craft/shared";
import { IMAGE_CONFIG } from "@cover-craft/shared";
import { useEffect, useRef } from "react";

interface PreviewCanvasProps {
	params: ImageParams;
	className?: string;
}

export function PreviewCanvas({ params, className }: PreviewCanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Clear canvas
		ctx.clearRect(0, 0, params.width, params.height);

		// Draw background
		ctx.fillStyle = params.backgroundColor;
		ctx.fillRect(0, 0, params.width, params.height);

		// Calculate text positioning (same logic as backend)
		const padding = IMAGE_CONFIG.dimensions.padding;
		const maxTextWidth = params.width - padding * 2;
		const centerX = params.width / 2;
		const centerY = params.height / 2;

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

		// Draw heading
		ctx.fillStyle = params.textColor;
		ctx.font = `bold ${headingFontSize}px "${params.font}"`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";

		const headingY = params.subtitle ? centerY - lineSpacing / 2 : centerY;
		ctx.fillText(params.title || "Your Title", centerX, headingY, maxTextWidth);

		// Draw subheading
		if (params.subtitle) {
			ctx.font = `normal ${subheadingFontSize}px "${params.font}"`;
			const subheadingY = centerY + lineSpacing / 2;
			ctx.fillText(params.subtitle, centerX, subheadingY, maxTextWidth);
		}
	}, [params]);

	return (
		<canvas
			ref={canvasRef}
			width={params.width}
			height={params.height}
			className={className}
			style={{
				maxWidth: "100%",
				height: "auto",
				display: "block",
				borderRadius: "inherit",
			}}
		/>
	);
}
