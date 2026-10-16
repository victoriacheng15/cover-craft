import type { BorderLines, BorderStyle } from "@cover-craft/shared";

export const BORDER_INSET = 18.0;
export const BORDER_DOUBLE_INSET = 28.0;
export const BORDER_LINE_WIDTH = 4.0;

/**
 * Draws a standardized border onto an HTML5 CanvasRenderingContext2D matching Go backend math.
 */
export function drawCanvasBorder(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	style: BorderStyle | undefined,
	lines: BorderLines | undefined,
	color: string,
): void {
	if (!style || style === "none") {
		return;
	}

	ctx.save();
	ctx.strokeStyle = color;
	ctx.lineWidth = BORDER_LINE_WIDTH;

	const drawShape = (inset: number) => {
		const w = width - 2 * inset;
		const h = height - 2 * inset;
		if (w <= 0 || h <= 0) return;

		switch (style) {
			case "solid":
				ctx.setLineDash([]);
				ctx.strokeRect(inset, inset, w, h);
				break;
			case "dashed":
				ctx.setLineDash([16, 8]);
				ctx.strokeRect(inset, inset, w, h);
				break;
			case "dotted":
				ctx.setLineDash([0.1, 10]);
				ctx.lineCap = "round";
				ctx.strokeRect(inset, inset, w, h);
				break;
			case "rounded": {
				ctx.setLineDash([]);
				const minDim = Math.min(width, height);
				let radius = Math.round(Math.max(12.0, minDim * 0.025));
				if (inset > BORDER_INSET) {
					radius = Math.max(6.0, radius - (inset - BORDER_INSET));
				}
				ctx.beginPath();
				if (typeof ctx.roundRect === "function") {
					ctx.roundRect(inset, inset, w, h, radius);
				} else {
					ctx.moveTo(inset + radius, inset);
					ctx.arcTo(inset + w, inset, inset + w, inset + h, radius);
					ctx.arcTo(inset + w, inset + h, inset, inset + h, radius);
					ctx.arcTo(inset, inset + h, inset, inset, radius);
					ctx.arcTo(inset, inset, inset + w, inset, radius);
					ctx.closePath();
				}
				ctx.stroke();
				break;
			}
			case "brackets": {
				ctx.setLineDash([]);
				const minDim = Math.min(width, height);
				let arm = Math.round(Math.max(24.0, minDim * 0.04));
				if (arm > w / 2) arm = w / 2;
				if (arm > h / 2) arm = h / 2;

				const x1 = inset;
				const y1 = inset;
				const x2 = inset + w;
				const y2 = inset + h;

				ctx.beginPath();
				// Top-left corner
				ctx.moveTo(x1, y1 + arm);
				ctx.lineTo(x1, y1);
				ctx.lineTo(x1 + arm, y1);
				// Top-right corner
				ctx.moveTo(x2 - arm, y1);
				ctx.lineTo(x2, y1);
				ctx.lineTo(x2, y1 + arm);
				// Bottom-right corner
				ctx.moveTo(x2, y2 - arm);
				ctx.lineTo(x2, y2);
				ctx.lineTo(x2 - arm, y2);
				// Bottom-left corner
				ctx.moveTo(x1 + arm, y2);
				ctx.lineTo(x1, y2);
				ctx.lineTo(x1, y2 - arm);
				ctx.stroke();
				break;
			}
		}
	};

	drawShape(BORDER_INSET);
	if (lines === "double") {
		drawShape(BORDER_DOUBLE_INSET);
	}

	ctx.restore();
}
