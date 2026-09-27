import { FONT_OPTIONS } from "@cover-craft/shared";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FontSelect } from "./FontSelect";

describe("FontSelect", () => {
	it("renders font select with all font options", () => {
		render(
			<FontSelect
				value="Montserrat"
				onChange={vi.fn()}
				ariaLabel="Select font for cover"
			/>,
		);

		const select = screen.getByLabelText("Select font for cover");
		expect(select).toBeInTheDocument();
		expect(select).toHaveValue("Montserrat");

		for (const font of FONT_OPTIONS) {
			expect(screen.getByRole("option", { name: font })).toBeInTheDocument();
		}
	});

	it("calls onChange when selecting a different font", () => {
		const handleChange = vi.fn();

		render(
			<FontSelect
				value="Montserrat"
				onChange={handleChange}
				ariaLabel="Select font"
			/>,
		);

		const select = screen.getByLabelText("Select font");
		fireEvent.change(select, { target: { value: "Roboto" } });

		expect(handleChange).toHaveBeenCalledWith("Roboto");
	});

	it("renders custom id and label", () => {
		render(
			<FontSelect
				id="custom-font-id"
				label="Deck Typography"
				value="Lato"
				onChange={vi.fn()}
			/>,
		);

		expect(screen.getByText("Deck Typography")).toBeInTheDocument();
		expect(screen.getByLabelText("Select font")).toHaveAttribute(
			"id",
			"custom-font-id",
		);
	});
});
