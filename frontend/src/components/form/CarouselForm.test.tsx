import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCarouselForm } from "@/hooks/useCarouselForm";
import { CarouselForm } from "./CarouselForm";

vi.mock("@/hooks/useCarouselForm", () => ({
	useCarouselForm: vi.fn(),
}));

// Mock Preview Canvas as HTML5 canvas context isn't fully mocked in jsdom
vi.mock("./CarouselPreviewDisplay", () => ({
	CarouselPreviewDisplay: ({
		activeSlideIndex,
		slides,
		handleDownloadPDF,
		handleDownloadSlide,
		pdfUrl,
		slideResults,
	}: {
		activeSlideIndex: number;
		slides: Array<{ id: string; title: string }>;
		handleDownloadPDF: () => void;
		handleDownloadSlide: (idx: number) => void;
		pdfUrl: string | null;
		slideResults: string[];
	}) => (
		<div data-testid="carousel-preview-display">
			<span>
				Slide {activeSlideIndex + 1} of {slides.length}
			</span>
			{pdfUrl && (
				<button type="button" onClick={handleDownloadPDF}>
					Download PDF
				</button>
			)}
			{slideResults[activeSlideIndex] && (
				<button
					type="button"
					onClick={() => handleDownloadSlide(activeSlideIndex)}
				>
					Slide PNG
				</button>
			)}
		</div>
	),
}));

const mockUseCarouselForm = vi.mocked(useCarouselForm);

describe("CarouselForm", () => {
	const mockSetActiveSlideIndex = vi.fn();
	const mockUpdateDeckSettings = vi.fn();
	const mockAddSlide = vi.fn();
	const mockRemoveSlide = vi.fn();
	const mockMoveSlide = vi.fn();
	const mockUpdateSlide = vi.fn();
	const mockHandleGenerate = vi.fn();
	const mockHandleDownloadSlide = vi.fn();
	const mockHandleDownloadPDF = vi.fn();
	const mockHandleDownloadZip = vi.fn();
	const mockHandleRandomizeColors = vi.fn();
	const mockHandleReset = vi.fn();

	const baseMockReturn = {
		deckSettings: {
			size: "Square (1080 × 1080)",
			width: 1080,
			height: 1080,
			backgroundColor: "#374151",
			textColor: "#F9FAFB",
			font: "Montserrat" as const,
			borderStyle: "none" as const,
			authorHandle: "@techlead",
			authorHandlePosition: "bottom-left" as const,
			slideNumberPosition: "top-right" as const,
			filename: "deck",
		},
		slides: [
			{
				id: "s-1",
				title: "Distributed Systems Intro",
				mode: "subtitle" as const,
				subtitle: "Foundations of Consensus",
				listItems: ["Item 1", "Item 2"],
				textAlign: "center" as const,
				verticalAlign: "center" as const,
			},
			{
				id: "s-2",
				title: "Raft Algorithm",
				mode: "list" as const,
				subtitle: "",
				listItems: ["Leader Election", "Log Replication"],
				textAlign: "left" as const,
				verticalAlign: "top" as const,
			},
		],
		activeSlideIndex: 0,
		activeSlide: {
			id: "s-1",
			title: "Distributed Systems Intro",
			mode: "subtitle" as const,
			subtitle: "Foundations of Consensus",
			listItems: ["Item 1", "Item 2"],
			textAlign: "center" as const,
			verticalAlign: "center" as const,
		},
		effectiveBg: "#374151",
		effectiveText: "#F9FAFB",
		contrastCheck: {
			status: "good" as const,
			ratio: 14.5,
			level: "AAA" as const,
			message: "14.5:1 ✓ AAA (Enhanced)",
			meetsWCAG: true,
		},
		isGenerating: false,
		status: "idle" as const,
		progress: 0,
		total: 2,
		jobId: null,
		slideResults: [],
		pdfUrl: null,
		error: null,
		isZipping: false,
		setActiveSlideIndex: mockSetActiveSlideIndex,
		updateDeckSettings: mockUpdateDeckSettings,
		addSlide: mockAddSlide,
		removeSlide: mockRemoveSlide,
		moveSlide: mockMoveSlide,
		updateSlide: mockUpdateSlide,
		handleGenerate: mockHandleGenerate,
		handleDownloadSlide: mockHandleDownloadSlide,
		handleDownloadPDF: mockHandleDownloadPDF,
		handleDownloadZip: mockHandleDownloadZip,
		handleRandomizeColors: mockHandleRandomizeColors,
		handleReset: mockHandleReset,
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockUseCarouselForm.mockReturnValue(baseMockReturn);
	});

	it("renders filmstrip tabs and handles slide tab clicks", () => {
		render(<CarouselForm />);

		const tab1 = screen.getByRole("tab", { name: /Slide 1/i });
		const tab2 = screen.getByRole("tab", { name: /Slide 2/i });

		expect(tab1).toBeInTheDocument();
		expect(tab2).toBeInTheDocument();

		fireEvent.click(tab2);
		expect(mockSetActiveSlideIndex).toHaveBeenCalledWith(1);
	});

	it("triggers slide addition and deletion from filmstrip controls", () => {
		const { rerender } = render(<CarouselForm />);

		const addBtn = screen.getByRole("button", {
			name: /Add a new slide to the carousel/i,
		});
		fireEvent.click(addBtn);
		expect(mockAddSlide).toHaveBeenCalledTimes(1);

		// With 2 slides, delete should be disabled
		const deleteBtn = screen.getByRole("button", {
			name: /Delete slide 1/i,
		});
		expect(deleteBtn).toBeDisabled();

		// Rerender with 3 slides
		mockUseCarouselForm.mockReturnValueOnce({
			...mockUseCarouselForm.mock.results[0].value,
			slides: [
				...mockUseCarouselForm.mock.results[0].value.slides,
				{
					id: "s-3",
					title: "Slide 3",
					mode: "list",
					subtitle: "",
					listItems: ["Item 1", "Item 2"],
					textAlign: "left",
					verticalAlign: "top",
				},
			],
		});

		rerender(<CarouselForm />);
		const activeDeleteBtn = screen.getByRole("button", {
			name: /Delete slide 1/i,
		});
		expect(activeDeleteBtn).not.toBeDisabled();
		fireEvent.click(activeDeleteBtn);
		expect(mockRemoveSlide).toHaveBeenCalledWith(0);
	});

	it("allows updating deck size directly from Canvas & Deck Settings", () => {
		render(<CarouselForm />);

		const sizeSelect = screen.getByLabelText(/Carousel dimensions format/i);
		fireEvent.change(sizeSelect, {
			target: { value: "Portrait (1080 × 1350)" },
		});

		expect(mockUpdateDeckSettings).toHaveBeenCalledWith({
			size: "Portrait (1080 × 1350)",
		});
	});

	it("updates active slide title when changed", () => {
		render(<CarouselForm />);

		const titleInput = screen.getByLabelText(/Slide title/i);
		fireEvent.change(titleInput, { target: { value: "New Amazing Title" } });

		expect(mockUpdateSlide).toHaveBeenCalledWith(0, {
			title: "New Amazing Title",
		});
	});

	it("switches content mode to bulleted list and adds list items", () => {
		render(<CarouselForm />);

		const listModeBtn = screen.getByRole("button", {
			name: /Bulleted List/i,
		});
		fireEvent.click(listModeBtn);

		expect(mockUpdateSlide).toHaveBeenCalledWith(0, { mode: "list" });
	});

	it("triggers handleGenerate on submit button click", () => {
		render(<CarouselForm />);

		const generateBtn = screen.getByRole("button", {
			name: /Generate carousel PDF and slide PNG images/i,
		});
		fireEvent.click(generateBtn);

		expect(mockHandleGenerate).toHaveBeenCalledTimes(1);
	});

	it("triggers handleReset on reset button click", () => {
		render(<CarouselForm />);

		const resetBtn = screen.getByRole("button", {
			name: /Reset entire carousel deck/i,
		});
		fireEvent.click(resetBtn);

		expect(mockHandleReset).toHaveBeenCalledTimes(1);
	});

	it("triggers handleRandomizeColors when Randomize Colors button is clicked", () => {
		render(<CarouselForm />);

		const randomizeBtn = screen.getByRole("button", {
			name: /Randomize/i,
		});
		fireEvent.click(randomizeBtn);

		expect(mockHandleRandomizeColors).toHaveBeenCalledTimes(1);
	});

	it("disables generate button when any slide has an empty title", () => {
		mockUseCarouselForm.mockReturnValueOnce({
			...baseMockReturn,
			slides: [
				{
					id: "s-1",
					title: "",
					mode: "subtitle",
					subtitle: "",
					listItems: [],
					textAlign: "center",
					verticalAlign: "center",
				},
				{
					id: "s-2",
					title: "Slide 2",
					mode: "subtitle",
					subtitle: "",
					listItems: [],
					textAlign: "left",
					verticalAlign: "top",
				},
			],
		});

		render(<CarouselForm />);
		const generateBtn = screen.getByRole("button", {
			name: /Generate carousel PDF and slide PNG images/i,
		});
		expect(generateBtn).toBeDisabled();
	});
});
