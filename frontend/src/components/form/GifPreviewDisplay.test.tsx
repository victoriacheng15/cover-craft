import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { GifFormData } from "@/hooks";
import { GifPreviewDisplay } from "./GifPreviewDisplay";

vi.mock("./CoverPreviewDisplay", () => ({
	PreviewCanvas: ({
		params,
	}: {
		params: { title: string; textColor: string };
	}) => (
		<div data-testid={`preview-canvas-${params.title}`}>
			<span>{params.title}</span>
			<span>{params.textColor}</span>
		</div>
	),
}));

describe("GifPreviewDisplay", () => {
	const mockFormData: GifFormData = {
		size: "Post (1200 × 627)",
		filename: "slideshow",
		backgroundColor: "#374151",
		textColor: "#FFFFFF",
		delayMs: 1500,
		font: "Montserrat",
		hasBorder: true,
		slides: [
			{
				id: "slide-1",
				title: "Intro Slide",
				subtitle: "Getting started",
			},
			{
				id: "slide-2",
				title: "Feature Slide",
				subtitle: "Core capabilities",
			},
		],
	};

	const defaultProps = {
		formData: mockFormData,
		generatedGifUrl: null,
		getPreviewDimensions: () => ({ width: 1200, height: 627 }),
		handleDownload: vi.fn(),
	};

	it("renders all slides from top to bottom", () => {
		render(<GifPreviewDisplay {...defaultProps} />);

		expect(screen.getByText("Live Slides Preview")).toBeInTheDocument();
		expect(screen.getByText("Slide 1")).toBeInTheDocument();
		expect(screen.getByText("Slide 2")).toBeInTheDocument();
		expect(screen.getAllByText("Intro Slide").length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText("Feature Slide").length).toBeGreaterThanOrEqual(
			1,
		);
		expect(
			screen.getByTestId("preview-canvas-Intro Slide"),
		).toBeInTheDocument();
		expect(
			screen.getByTestId("preview-canvas-Feature Slide"),
		).toBeInTheDocument();
	});

	it("renders generated animated GIF and download button when generatedGifUrl is present", () => {
		render(
			<GifPreviewDisplay
				{...defaultProps}
				generatedGifUrl="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
			/>,
		);

		expect(screen.getByText("Generated Animated GIF")).toBeInTheDocument();
		expect(
			screen.getByRole("button", {
				name: /download generated animated gif/i,
			}),
		).toBeInTheDocument();
	});
});
