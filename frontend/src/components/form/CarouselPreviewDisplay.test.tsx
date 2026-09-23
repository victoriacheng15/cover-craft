import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	CarouselPreviewDisplay,
	type CarouselPreviewDisplayProps,
} from "./CarouselPreviewDisplay";

describe("CarouselPreviewDisplay", () => {
	const mockSetActiveSlideIndex = vi.fn();
	const mockHandleDownloadSlide = vi.fn();
	const mockHandleDownloadPDF = vi.fn();
	const mockHandleDownloadZip = vi.fn();

	const defaultProps: CarouselPreviewDisplayProps = {
		deckSettings: {
			size: "Square (1080 × 1080)",
			width: 1080,
			height: 1080,
			backgroundColor: "#374151",
			textColor: "#F9FAFB",
			font: "Montserrat",
			borderStyle: "none",
			authorHandle: "@handle",
			authorHandlePosition: "bottom-left",
			slideNumberPosition: "top-right",
			filename: "deck",
		},
		slides: [
			{
				id: "s-1",
				title: "Slide One",
				mode: "subtitle",
				subtitle: "Subtitle One",
				listItems: [],
				textAlign: "center",
				verticalAlign: "center",
			},
			{
				id: "s-2",
				title: "Slide Two",
				mode: "list",
				subtitle: "",
				listItems: ["Bullet 1", "Bullet 2"],
				textAlign: "left",
				verticalAlign: "top",
			},
		],
		activeSlideIndex: 0,
		setActiveSlideIndex: mockSetActiveSlideIndex,
		isGenerating: false,
		status: "idle",
		progress: 0,
		total: 2,
		pdfUrl: null,
		slideResults: [],
		isZipping: false,
		handleDownloadSlide: mockHandleDownloadSlide,
		handleDownloadPDF: mockHandleDownloadPDF,
		handleDownloadZip: mockHandleDownloadZip,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders slide index indicator and stepper navigation", () => {
		render(<CarouselPreviewDisplay {...defaultProps} />);

		expect(screen.getByText("Slide Preview")).toBeInTheDocument();
		expect(screen.getByText("Slide 1 of 2")).toBeInTheDocument();

		const prevBtn = screen.getByRole("button", {
			name: /Previous slide preview/i,
		});
		const nextBtn = screen.getByRole("button", {
			name: /Next slide preview/i,
		});

		expect(prevBtn).toBeDisabled();
		expect(nextBtn).toBeEnabled();

		fireEvent.click(nextBtn);
		expect(mockSetActiveSlideIndex).toHaveBeenCalledWith(1);
	});

	it("renders generation progress bar when isGenerating is true", () => {
		render(
			<CarouselPreviewDisplay
				{...defaultProps}
				isGenerating={true}
				status="processing"
				progress={1}
				total={2}
			/>,
		);

		expect(screen.getByText("Rendering slides (1/2)...")).toBeInTheDocument();
		expect(screen.getByText("50%")).toBeInTheDocument();
	});

	it("renders download buttons and handles clicks when results are ready", () => {
		render(
			<CarouselPreviewDisplay
				{...defaultProps}
				pdfUrl="data:application/pdf;base64,sample"
				slideResults={["data:image/png;base64,p1", "data:image/png;base64,p2"]}
			/>,
		);

		const pdfBtn = screen.getByRole("button", {
			name: /Download compiled PDF carousel/i,
		});
		const slidePngBtn = screen.getByRole("button", {
			name: /Download slide 1 PNG/i,
		});
		const zipBtn = screen.getByRole("button", {
			name: /Download all slides and PDF as ZIP package/i,
		});

		expect(pdfBtn).toBeInTheDocument();
		expect(slidePngBtn).toBeInTheDocument();
		expect(zipBtn).toBeInTheDocument();

		fireEvent.click(pdfBtn);
		expect(mockHandleDownloadPDF).toHaveBeenCalledTimes(1);

		fireEvent.click(slidePngBtn);
		expect(mockHandleDownloadSlide).toHaveBeenCalledWith(0);

		fireEvent.click(zipBtn);
		expect(mockHandleDownloadZip).toHaveBeenCalledTimes(1);
	});
});
