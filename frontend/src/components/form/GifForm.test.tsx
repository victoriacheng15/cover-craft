import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useGifForm } from "@/hooks";
import { GifForm } from "./GifForm";

vi.mock("@/hooks", async () => {
	const actual = await vi.importActual("@/hooks");
	return {
		...actual,
		useGifForm: vi.fn(),
	};
});

vi.mock("./GifPreviewDisplay", () => ({
	GifPreviewDisplay: () => <div data-testid="gif-preview-display">Preview</div>,
}));

const mockUseGifForm = vi.mocked(useGifForm);

describe("GifForm", () => {
	const mockAddSlide = vi.fn();
	const mockRemoveSlide = vi.fn();
	const mockUpdateSlide = vi.fn();
	const mockSetSize = vi.fn();
	const mockSetBackgroundColor = vi.fn();
	const mockSetTextColor = vi.fn();
	const mockSetDelayMs = vi.fn();
	const mockSetFilename = vi.fn();
	const mockSetFont = vi.fn();
	const mockSetHasBorder = vi.fn();
	const mockHandleRandomizeColors = vi.fn();
	const mockHandleGenerate = vi.fn();
	const mockHandleDownload = vi.fn();
	const mockHandleReset = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		mockUseGifForm.mockReturnValue({
			formData: {
				size: "Post (1200 × 627)",
				filename: "slideshow",
				backgroundColor: "#374151",
				textColor: "#F9FAFB",
				delayMs: 1500,
				font: "Montserrat",
				hasBorder: false,
				slides: [
					{
						id: "slide-1",
						title: "Slide 1 Title",
						subtitle: "Slide 1 Subtitle",
					},
					{
						id: "slide-2",
						title: "Slide 2 Title",
						subtitle: "",
					},
				],
			},
			contrastCheck: {
				status: "good",
				ratio: 9.86,
				level: "AAA",
				message: "9.86:1 ✓ AAA (Enhanced)",
				meetsWCAG: true,
			},
			isGenerating: false,
			error: null,
			generatedGifUrl: null,
			activeSlideIndex: 0,
			activeSlide: {
				id: "slide-1",
				title: "Slide 1 Title",
				subtitle: "Slide 1 Subtitle",
			},
			setActiveSlideIndex: vi.fn(),
			setSize: mockSetSize,
			setBackgroundColor: mockSetBackgroundColor,
			setTextColor: mockSetTextColor,
			setDelayMs: mockSetDelayMs,
			setFilename: mockSetFilename,
			setFont: mockSetFont,
			setHasBorder: mockSetHasBorder,
			addSlide: mockAddSlide,
			removeSlide: mockRemoveSlide,
			moveSlide: vi.fn(),
			updateSlide: mockUpdateSlide,
			handleRandomizeColors: mockHandleRandomizeColors,
			getPreviewDimensions: () => ({ width: 1200, height: 627 }),
			handleGenerate: mockHandleGenerate,
			handleDownload: mockHandleDownload,
			handleReset: mockHandleReset,
		});
	});

	it("renders delay preset checkboxes and triggers setDelayMs", () => {
		render(<GifForm />);

		const delay1000 = screen.getByLabelText(
			"Set slide delay to 1000 milliseconds",
		);
		const delay1500 = screen.getByLabelText(
			"Set slide delay to 1500 milliseconds",
		);
		const delay2000 = screen.getByLabelText(
			"Set slide delay to 2000 milliseconds",
		);
		const delay3000 = screen.getByLabelText(
			"Set slide delay to 3000 milliseconds",
		);

		expect(delay1000).toBeInTheDocument();
		expect(delay1500).toBeChecked();
		expect(delay2000).toBeInTheDocument();
		expect(delay3000).toBeInTheDocument();

		fireEvent.click(delay2000);
		expect(mockSetDelayMs).toHaveBeenCalledWith(2000);
	});

	it("renders slides and handles adding new slides", () => {
		render(<GifForm />);

		expect(screen.getByText("Slides (2/10)")).toBeInTheDocument();
		expect(screen.getByText("Slide 1")).toBeInTheDocument();
		expect(screen.getByText("Slide 2")).toBeInTheDocument();

		const addBtn = screen.getByRole("button", { name: /add a new slide/i });
		fireEvent.click(addBtn);

		expect(mockAddSlide).toHaveBeenCalled();
	});

	it("triggers handleGenerate on Generate GIF click", () => {
		render(<GifForm />);

		const generateBtn = screen.getByRole("button", {
			name: /generate animated gif slideshow/i,
		});
		fireEvent.click(generateBtn);

		expect(mockHandleGenerate).toHaveBeenCalled();
	});

	it("triggers handleReset on Reset click", () => {
		render(<GifForm />);

		const resetBtn = screen.getByRole("button", {
			name: /reset slideshow form/i,
		});
		fireEvent.click(resetBtn);

		expect(mockHandleReset).toHaveBeenCalled();
	});

	it("renders font selector and triggers setFont", () => {
		render(<GifForm />);

		const fontSelect = screen.getByLabelText("Select font for all slides");
		expect(fontSelect).toHaveValue("Montserrat");

		fireEvent.change(fontSelect, { target: { value: "Roboto" } });
		expect(mockSetFont).toHaveBeenCalledWith("Roboto");
	});

	it("renders border checkbox and triggers setHasBorder", () => {
		render(<GifForm />);

		const borderCheckbox = screen.getByLabelText("Add border to all slides");
		expect(borderCheckbox).not.toBeChecked();

		fireEvent.click(borderCheckbox);
		expect(mockSetHasBorder).toHaveBeenCalledWith(true);
	});
});
