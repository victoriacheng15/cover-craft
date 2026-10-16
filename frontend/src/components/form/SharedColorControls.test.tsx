import { COLOR_PRESETS, getContrastRatio } from "@cover-craft/shared";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ContrastCheckResult } from "@/hooks";
import {
	ColorContrastMessage,
	SharedColorControls,
} from "./SharedColorControls";

describe("SharedColorControls", () => {
	const mockContrast: ContrastCheckResult = {
		meetsWCAG: true,
		ratio: 7.5,
		status: "good",
		message: "Great contrast (7.5:1)",
		level: "AAA",
	};

	it("renders background and text color inputs and randomize button", () => {
		render(
			<SharedColorControls
				backgroundColor="#111111"
				textColor="#eeeeee"
				onBackgroundColorChange={vi.fn()}
				onTextColorChange={vi.fn()}
				onRandomizeColors={vi.fn()}
			/>,
		);

		const bgPicker = screen.getByLabelText("Background color picker");
		const textPicker = screen.getByLabelText("Text color picker");
		const randomizeBtn = screen.getByRole("button", {
			name: /randomize background and text colors/i,
		});

		expect(bgPicker).toBeInTheDocument();
		expect(bgPicker).toHaveValue("#111111");
		expect(textPicker).toBeInTheDocument();
		expect(textPicker).toHaveValue("#eeeeee");
		expect(randomizeBtn).toBeInTheDocument();
	});

	it("calls change handlers on input", () => {
		const handleBgChange = vi.fn();
		const handleTextChange = vi.fn();
		const handleRandomize = vi.fn();

		render(
			<SharedColorControls
				backgroundColor="#000000"
				textColor="#ffffff"
				onBackgroundColorChange={handleBgChange}
				onTextColorChange={handleTextChange}
				onRandomizeColors={handleRandomize}
			/>,
		);

		fireEvent.click(
			screen.getByRole("button", {
				name: /randomize background and text colors/i,
			}),
		);
		expect(handleRandomize).toHaveBeenCalledTimes(1);
	});

	it("renders contrast message when contrastCheck is provided", () => {
		render(
			<SharedColorControls
				backgroundColor="#000000"
				textColor="#ffffff"
				onBackgroundColorChange={vi.fn()}
				onTextColorChange={vi.fn()}
				onRandomizeColors={vi.fn()}
				contrastCheck={mockContrast}
			/>,
		);

		expect(screen.getByText("Great contrast (7.5:1)")).toBeInTheDocument();
	});

	it("applies custom idPrefix and titleContext", () => {
		render(
			<SharedColorControls
				backgroundColor="#000000"
				textColor="#ffffff"
				onBackgroundColorChange={vi.fn()}
				onTextColorChange={vi.fn()}
				onRandomizeColors={vi.fn()}
				idPrefix="deck"
				titleContext="carousel"
			/>,
		);

		const bgPicker = screen.getByLabelText("Background color picker");
		expect(bgPicker).toHaveAttribute("id", "deck-background-color");
		expect(bgPicker).toHaveAttribute(
			"title",
			"Choose background color for your carousel",
		);
	});

	it("renders all color presets and triggers change handlers on selection", () => {
		const handleBgChange = vi.fn();
		const handleTextChange = vi.fn();

		render(
			<SharedColorControls
				backgroundColor="#000000"
				textColor="#ffffff"
				onBackgroundColorChange={handleBgChange}
				onTextColorChange={handleTextChange}
				onRandomizeColors={vi.fn()}
			/>,
		);

		expect(
			screen.getByRole("group", { name: "Color Presets" }),
		).toBeInTheDocument();

		const darkBtn = screen.getByRole("button", { name: "Dark" });
		const lightBtn = screen.getByRole("button", { name: "Light" });
		expect(darkBtn).toHaveAttribute("aria-pressed", "true");
		expect(lightBtn).toHaveAttribute("aria-pressed", "false");

		// Dark presets are displayed by default
		for (const preset of COLOR_PRESETS.filter((p) => p.theme === "dark")) {
			const btn = screen.getByRole("button", {
				name: new RegExp(`Apply ${preset.name} colors`, "i"),
			});
			expect(btn).toBeInTheDocument();
			expect(btn).toHaveAttribute("aria-pressed", "false");
		}

		// Light presets are not visible while Dark is active
		for (const preset of COLOR_PRESETS.filter((p) => p.theme === "light")) {
			expect(
				screen.queryByRole("button", {
					name: new RegExp(`Apply ${preset.name} colors`, "i"),
				}),
			).not.toBeInTheDocument();
		}

		// Switch to Light theme
		fireEvent.click(lightBtn);
		expect(lightBtn).toHaveAttribute("aria-pressed", "true");
		expect(darkBtn).toHaveAttribute("aria-pressed", "false");

		// Light presets are now visible
		for (const preset of COLOR_PRESETS.filter((p) => p.theme === "light")) {
			const btn = screen.getByRole("button", {
				name: new RegExp(`Apply ${preset.name} colors`, "i"),
			});
			expect(btn).toBeInTheDocument();
			expect(btn).toHaveAttribute("aria-pressed", "false");
		}

		const mistSlateBtn = screen.getByRole("button", {
			name: /Apply Mist Slate colors/i,
		});
		fireEvent.click(mistSlateBtn);

		expect(handleBgChange).toHaveBeenCalledWith("#E2E8F0");
		expect(handleTextChange).toHaveBeenCalledWith("#0F172A");
	});

	it("sets aria-pressed to true on the currently active preset", () => {
		render(
			<SharedColorControls
				backgroundColor="#0F172A"
				textColor="#F8FAFC"
				onBackgroundColorChange={vi.fn()}
				onTextColorChange={vi.fn()}
				onRandomizeColors={vi.fn()}
			/>,
		);

		const activeBtn = screen.getByRole("button", {
			name: /Apply Cloud Navy colors/i,
		});
		expect(activeBtn).toHaveAttribute("aria-pressed", "true");

		const inactiveBtn = screen.getByRole("button", {
			name: /Apply Terminal Matrix colors/i,
		});
		expect(inactiveBtn).toHaveAttribute("aria-pressed", "false");
	});

	it("verifies all COLOR_PRESETS exceed WCAG AAA threshold (>= 7.0:1) and avoid pure black text", () => {
		for (const preset of COLOR_PRESETS) {
			const ratio = getContrastRatio(preset.backgroundColor, preset.textColor);
			expect(ratio).not.toBeNull();
			expect(ratio).toBeGreaterThanOrEqual(7.0);
			expect(preset.textColor.toLowerCase()).not.toBe("#000000");
		}
	});
});

describe("ColorContrastMessage", () => {
	it("renders status indicator and message", () => {
		const contrast: ContrastCheckResult = {
			meetsWCAG: false,
			ratio: 2.1,
			status: "poor",
			message: "Poor contrast (2.1:1)",
			level: "FAIL",
		};

		render(<ColorContrastMessage contrastCheck={contrast} />);

		expect(screen.getByText("Color Contrast")).toBeInTheDocument();
		expect(screen.getByText("Poor contrast (2.1:1)")).toBeInTheDocument();
	});

	it("renders stacked layout when stacked prop is true", () => {
		const contrast: ContrastCheckResult = {
			meetsWCAG: true,
			ratio: 5.0,
			status: "warning",
			message: "Acceptable (5.0:1)",
			level: "AA",
		};

		const { container } = render(
			<ColorContrastMessage contrastCheck={contrast} stacked />,
		);

		expect(container.firstChild).toHaveClass("flex-col");
		expect(screen.getByText("Acceptable (5.0:1)")).toBeInTheDocument();
	});
});
