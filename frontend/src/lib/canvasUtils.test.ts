import { describe, expect, it, vi } from "vitest";
import {
	BORDER_DOUBLE_INSET,
	BORDER_INSET,
	BORDER_LINE_WIDTH,
	drawCanvasBorder,
} from "./canvasUtils";

function createMockContext() {
	return {
		save: vi.fn(),
		restore: vi.fn(),
		strokeRect: vi.fn(),
		setLineDash: vi.fn(),
		beginPath: vi.fn(),
		roundRect: vi.fn(),
		moveTo: vi.fn(),
		lineTo: vi.fn(),
		arcTo: vi.fn(),
		closePath: vi.fn(),
		stroke: vi.fn(),
		strokeStyle: "",
		lineWidth: 0,
		lineCap: "butt",
	} as unknown as CanvasRenderingContext2D;
}

describe("drawCanvasBorder", () => {
	it("returns early when style is none or undefined", () => {
		const ctx = createMockContext();
		drawCanvasBorder(ctx, 1200, 630, "none", "single", "#FFFFFF");
		expect(ctx.save).not.toHaveBeenCalled();

		drawCanvasBorder(ctx, 1200, 630, undefined, "single", "#FFFFFF");
		expect(ctx.save).not.toHaveBeenCalled();
	});

	it("renders solid single border", () => {
		const ctx = createMockContext();
		drawCanvasBorder(ctx, 1200, 630, "solid", "single", "#FFFFFF");

		expect(ctx.save).toHaveBeenCalledTimes(1);
		expect(ctx.restore).toHaveBeenCalledTimes(1);
		expect(ctx.strokeStyle).toBe("#FFFFFF");
		expect(ctx.lineWidth).toBe(BORDER_LINE_WIDTH);
		expect(ctx.setLineDash).toHaveBeenCalledWith([]);
		expect(ctx.strokeRect).toHaveBeenCalledTimes(1);
		expect(ctx.strokeRect).toHaveBeenCalledWith(
			BORDER_INSET,
			BORDER_INSET,
			1200 - 2 * BORDER_INSET,
			630 - 2 * BORDER_INSET,
		);
	});

	it("renders solid double border with two strokes", () => {
		const ctx = createMockContext();
		drawCanvasBorder(ctx, 1200, 630, "solid", "double", "#FFFFFF");

		expect(ctx.strokeRect).toHaveBeenCalledTimes(2);
		expect(ctx.strokeRect).toHaveBeenNthCalledWith(
			1,
			BORDER_INSET,
			BORDER_INSET,
			1200 - 2 * BORDER_INSET,
			630 - 2 * BORDER_INSET,
		);
		expect(ctx.strokeRect).toHaveBeenNthCalledWith(
			2,
			BORDER_DOUBLE_INSET,
			BORDER_DOUBLE_INSET,
			1200 - 2 * BORDER_DOUBLE_INSET,
			630 - 2 * BORDER_DOUBLE_INSET,
		);
	});

	it("renders dashed border with dash pattern [16, 8]", () => {
		const ctx = createMockContext();
		drawCanvasBorder(ctx, 800, 600, "dashed", "single", "#10B981");

		expect(ctx.setLineDash).toHaveBeenCalledWith([16, 8]);
		expect(ctx.strokeRect).toHaveBeenCalledTimes(1);
	});

	it("renders dotted border with lineCap round and dash pattern [0.1, 10]", () => {
		const ctx = createMockContext();
		drawCanvasBorder(ctx, 800, 600, "dotted", "single", "#10B981");

		expect(ctx.setLineDash).toHaveBeenCalledWith([0.1, 10]);
		expect(ctx.lineCap).toBe("round");
		expect(ctx.strokeRect).toHaveBeenCalledTimes(1);
	});

	it("renders rounded border using roundRect when available", () => {
		const ctx = createMockContext();
		drawCanvasBorder(ctx, 1000, 800, "rounded", "single", "#3B82F6");

		expect(ctx.beginPath).toHaveBeenCalledTimes(1);
		expect(ctx.roundRect).toHaveBeenCalledTimes(1);
		expect(ctx.stroke).toHaveBeenCalledTimes(1);
	});

	it("renders brackets border with 8 line segments per inset", () => {
		const ctx = createMockContext();
		drawCanvasBorder(ctx, 1000, 800, "brackets", "single", "#EC4899");

		expect(ctx.beginPath).toHaveBeenCalledTimes(1);
		// 4 corners * 2 lines each = 8 moveTo/lineTo calls
		expect(ctx.moveTo).toHaveBeenCalledTimes(4);
		expect(ctx.lineTo).toHaveBeenCalledTimes(8);
		expect(ctx.stroke).toHaveBeenCalledTimes(1);
	});

	it("handles dimensions smaller than inset gracefully", () => {
		const ctx = createMockContext();
		drawCanvasBorder(ctx, 20, 20, "solid", "double", "#FFFFFF");

		expect(ctx.strokeRect).not.toHaveBeenCalled();
	});
});
