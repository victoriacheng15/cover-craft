import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Select from "./Select";

describe("Select", () => {
	it("renders correctly", () => {
		render(
			<Select data-testid="select-field">
				<option>Option 1</option>
			</Select>,
		);
		const select = screen.getByTestId("select-field");
		expect(select).toBeInTheDocument();
	});

	it("renders with children options", () => {
		render(
			<Select data-testid="select-field">
				<option>Option 1</option>
				<option>Option 2</option>
				<option>Option 3</option>
			</Select>,
		);
		expect(screen.getByText("Option 1")).toBeInTheDocument();
		expect(screen.getByText("Option 2")).toBeInTheDocument();
		expect(screen.getByText("Option 3")).toBeInTheDocument();
	});

	it("applies additional className", () => {
		render(
			<Select data-testid="select-field" className="custom-class">
				<option>Option 1</option>
			</Select>,
		);
		const select = screen.getByTestId("select-field");
		expect(select).toHaveClass("custom-class");
	});

	it("handles value and onChange", () => {
		const handleChange = vi.fn();
		render(
			<Select
				data-testid="select-field"
				value="option1"
				onChange={handleChange}
			>
				<option value="option1">Option 1</option>
				<option value="option2">Option 2</option>
			</Select>,
		);

		const select = screen.getByTestId("select-field") as HTMLSelectElement;
		expect(select.value).toBe("option1");

		fireEvent.change(select, { target: { value: "option2" } });
		expect(handleChange).toHaveBeenCalled();
	});

	it("is disabled when disabled prop is set", () => {
		render(
			<Select data-testid="select-field" disabled>
				<option>Option 1</option>
			</Select>,
		);
		const select = screen.getByTestId("select-field");
		expect(select).toBeDisabled();
	});

	it("handles multiple attribute", () => {
		render(
			<Select data-testid="select-field" multiple>
				<option>Option 1</option>
				<option>Option 2</option>
			</Select>,
		);
		const select = screen.getByTestId("select-field") as HTMLSelectElement;
		expect(select.multiple).toBe(true);
	});

	it("renders with optgroup", () => {
		render(
			<Select data-testid="select-field">
				<optgroup label="Group 1">
					<option>Option 1</option>
					<option>Option 2</option>
				</optgroup>
				<optgroup label="Group 2">
					<option>Option 3</option>
				</optgroup>
			</Select>,
		);
		expect(screen.getByText("Option 1")).toBeInTheDocument();
		expect(screen.getByText("Option 3")).toBeInTheDocument();
	});

	it("accepts custom HTML attributes", () => {
		render(
			<Select
				data-testid="select-field"
				id="custom-id"
				name="custom-name"
				aria-label="Select"
			>
				<option>Option 1</option>
			</Select>,
		);
		const select = screen.getByTestId("select-field");
		expect(select).toHaveAttribute("id", "custom-id");
		expect(select).toHaveAttribute("name", "custom-name");
		expect(select).toHaveAttribute("aria-label", "Select");
	});

	it("renders with required attribute", () => {
		render(
			<Select data-testid="select-field" required>
				<option>Option 1</option>
			</Select>,
		);
		const select = screen.getByTestId("select-field") as HTMLSelectElement;
		expect(select.required).toBe(true);
	});
});
