import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
	CanvasSettingsCard,
	type CanvasSettingsCardProps,
} from "./CanvasSettingsCard";

describe("CanvasSettingsCard", () => {
	const mockOnSizeChange = vi.fn();
	const mockOnFontChange = vi.fn();
	const mockOnFilenameChange = vi.fn();
	const mockOnBackgroundColorChange = vi.fn();
	const mockOnTextColorChange = vi.fn();
	const mockOnRandomizeColors = vi.fn();
	const mockOnBorderStyleChange = vi.fn();
	const mockOnBorderLinesChange = vi.fn();
	const mockOnGenerate = vi.fn();
	const mockOnReset = vi.fn();

	const defaultProps: CanvasSettingsCardProps = {
		title: "Canvas & Settings",
		sizeId: "test-size",
		sizeValue: "Post (1200 × 627)",
		sizeOptions: ["Post (1200 × 627)", "Square (1080 × 1080)"],
		onSizeChange: mockOnSizeChange,
		sizeAriaLabel: "Select size preset",
		fontId: "test-font",
		fontValue: "Montserrat",
		onFontChange: mockOnFontChange,
		fontAriaLabel: "Select font",
		filenameId: "test-filename",
		filenameValue: "my-test-asset",
		filenamePlaceholder: "custom-filename",
		filenameMaxLength: 50,
		onFilenameChange: mockOnFilenameChange,
		filenameAriaLabel: "Asset filename",
		backgroundColor: "#374151",
		textColor: "#F9FAFB",
		onBackgroundColorChange: mockOnBackgroundColorChange,
		onTextColorChange: mockOnTextColorChange,
		onRandomizeColors: mockOnRandomizeColors,
		contrastCheck: {
			status: "good",
			ratio: 9.86,
			level: "AAA",
			message: "9.86:1 ✓ AAA (Enhanced)",
			meetsWCAG: true,
		},
		colorIdPrefix: "test",
		colorTitleContext: "test-context",
		borderStyle: "solid",
		borderLines: "single",
		onBorderStyleChange: mockOnBorderStyleChange,
		onBorderLinesChange: mockOnBorderLinesChange,
		extraSettings: <div data-testid="extra-settings">Custom Slot</div>,
		error: null,
		isGenerating: false,
		generateDisabled: false,
		generateButtonLabel: "Generate Asset",
		onGenerate: mockOnGenerate,
		onReset: mockOnReset,
	};

	it("renders all setting controls and triggers interactive callbacks", () => {
		render(<CanvasSettingsCard {...defaultProps} />);

		expect(screen.getByText("Canvas & Settings")).toBeInTheDocument();
		expect(screen.getByTestId("extra-settings")).toBeInTheDocument();
		expect(screen.getByText("9.86:1 ✓ AAA (Enhanced)")).toBeInTheDocument();

		// Size preset change
		const sizeSelect = screen.getByLabelText("Select size preset");
		fireEvent.change(sizeSelect, {
			target: { value: "Square (1080 × 1080)" },
		});
		expect(mockOnSizeChange).toHaveBeenCalledWith("Square (1080 × 1080)");

		// Font select change
		const fontSelect = screen.getByLabelText("Select font");
		fireEvent.change(fontSelect, { target: { value: "Roboto" } });
		expect(mockOnFontChange).toHaveBeenCalledWith("Roboto");

		// Filename change
		const filenameInput = screen.getByLabelText("Asset filename");
		fireEvent.change(filenameInput, { target: { value: "updated-filename" } });
		expect(mockOnFilenameChange).toHaveBeenCalledWith("updated-filename");

		// Border style change
		const dottedBtn = screen.getByRole("button", { name: "Dotted" });
		fireEvent.click(dottedBtn);
		expect(mockOnBorderStyleChange).toHaveBeenCalledWith("dotted");

		// Border multiplicity change
		const doubleBtn = screen.getByRole("button", { name: "Double" });
		fireEvent.click(doubleBtn);
		expect(mockOnBorderLinesChange).toHaveBeenCalledWith("double");

		// Colors change
		const bgPicker = screen.getByLabelText("Background color picker");
		fireEvent.change(bgPicker, { target: { value: "#111827" } });
		expect(mockOnBackgroundColorChange).toHaveBeenCalledWith("#111827");

		const textPicker = screen.getByLabelText("Text color picker");
		fireEvent.change(textPicker, { target: { value: "#e5e7eb" } });
		expect(mockOnTextColorChange).toHaveBeenCalledWith("#e5e7eb");

		const randomizeBtn = screen.getByRole("button", {
			name: /randomize background and text colors/i,
		});
		fireEvent.click(randomizeBtn);
		expect(mockOnRandomizeColors).toHaveBeenCalled();

		// Actions
		const generateBtn = screen.getByRole("button", {
			name: /Generate Asset/i,
		});
		fireEvent.click(generateBtn);
		expect(mockOnGenerate).toHaveBeenCalled();

		const resetBtn = screen.getByRole("button", {
			name: /Reset form to default values/i,
		});
		fireEvent.click(resetBtn);
		expect(mockOnReset).toHaveBeenCalled();
	});

	it("disables generate button when generateDisabled is true", () => {
		render(
			<CanvasSettingsCard
				{...defaultProps}
				generateDisabled={true}
				generateButtonTitle="Title required"
			/>,
		);

		const generateBtn = screen.getByRole("button", {
			name: /Generate Asset/i,
		});
		expect(generateBtn).toBeDisabled();
		expect(generateBtn).toHaveAttribute("title", "Title required");
	});

	it("disables border multiplicity when borderStyle is none", () => {
		render(<CanvasSettingsCard {...defaultProps} borderStyle="none" />);

		const singleBtn = screen.getByRole("button", { name: "Single" });
		const doubleBtn = screen.getByRole("button", { name: "Double" });

		expect(singleBtn).toBeDisabled();
		expect(doubleBtn).toBeDisabled();
	});
});
