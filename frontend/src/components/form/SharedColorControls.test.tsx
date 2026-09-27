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
