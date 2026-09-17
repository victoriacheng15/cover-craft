import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { GifFormData } from "@/hooks";
import { GifSettingsControls } from "./GifSettingsControls";

describe("GifSettingsControls", () => {
	const mockFormData: GifFormData = {
		size: "Post (1200 × 627)",
		filename: "my-slideshow",
		backgroundColor: "#374151",
		textColor: "#F9FAFB",
		delayMs: 1500,
		font: "Montserrat",
		hasBorder: false,
		slides: [],
	};

	const mockSetSize = vi.fn();
	const mockSetBackgroundColor = vi.fn();
	const mockSetTextColor = vi.fn();
	const mockSetDelayMs = vi.fn();
	const mockSetFilename = vi.fn();
	const mockSetFont = vi.fn();
	const mockSetHasBorder = vi.fn();
	const mockHandleRandomizeColors = vi.fn();
	const mockHandleGenerate = vi.fn();
	const mockHandleReset = vi.fn();

	const defaultProps = {
		formData: mockFormData,
		contrastCheck: {
			status: "good" as const,
			ratio: 9.86,
			level: "AAA" as const,
			message: "9.86:1 ✓ AAA (Enhanced)",
			meetsWCAG: true,
		},
		setSize: mockSetSize,
		setBackgroundColor: mockSetBackgroundColor,
		setTextColor: mockSetTextColor,
		setDelayMs: mockSetDelayMs,
		setFilename: mockSetFilename,
		setFont: mockSetFont,
		setHasBorder: mockSetHasBorder,
		handleRandomizeColors: mockHandleRandomizeColors,
		handleGenerate: mockHandleGenerate,
		handleReset: mockHandleReset,
	};

	it("renders all setting controls and triggers callbacks", () => {
		render(<GifSettingsControls {...defaultProps} />);

		expect(screen.getByText("Canvas & Slideshow Settings")).toBeInTheDocument();
		expect(screen.getByText("Color Contrast")).toBeInTheDocument();
		expect(screen.getByText("9.86:1 ✓ AAA (Enhanced)")).toBeInTheDocument();

		const sizeSelect = screen.getByLabelText(
			"Select size preset for animated GIF",
		);
		fireEvent.change(sizeSelect, {
			target: { value: "Square (1080 × 1080)" },
		});
		expect(mockSetSize).toHaveBeenCalledWith("Square (1080 × 1080)");

		const fontSelect = screen.getByLabelText("Select font for all slides");
		fireEvent.change(fontSelect, { target: { value: "Roboto" } });
		expect(mockSetFont).toHaveBeenCalledWith("Roboto");

		const borderCheckbox = screen.getByLabelText("Add border to all slides");
		fireEvent.click(borderCheckbox);
		expect(mockSetHasBorder).toHaveBeenCalledWith(true);

		const bgPicker = screen.getByLabelText("Background color picker");
		fireEvent.change(bgPicker, { target: { value: "#111827" } });
		expect(mockSetBackgroundColor).toHaveBeenCalledWith("#111827");

		const textPicker = screen.getByLabelText("Text color picker");
		fireEvent.change(textPicker, { target: { value: "#e5e7eb" } });
		expect(mockSetTextColor).toHaveBeenCalledWith("#e5e7eb");

		const randomizeBtn = screen.getByRole("button", {
			name: /randomize background and text colors/i,
		});
		fireEvent.click(randomizeBtn);
		expect(mockHandleRandomizeColors).toHaveBeenCalled();

		const generateBtn = screen.getByRole("button", {
			name: /generate animated gif slideshow/i,
		});
		fireEvent.click(generateBtn);
		expect(mockHandleGenerate).toHaveBeenCalled();

		const resetBtn = screen.getByRole("button", {
			name: /reset slideshow form/i,
		});
		fireEvent.click(resetBtn);
		expect(mockHandleReset).toHaveBeenCalled();
	});
});
