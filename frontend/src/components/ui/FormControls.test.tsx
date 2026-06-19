import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ColorPicker, Input, Select } from "./FormControls";

describe("Input", () => {
	it("renders correctly", () => {
		render(<Input data-testid="input-field" />);
		const input = screen.getByTestId("input-field") as HTMLInputElement;
		expect(input).toBeInTheDocument();
	});

	it("renders with default type text", () => {
		render(<Input data-testid="input-field" />);
		const input = screen.getByTestId("input-field") as HTMLInputElement;
		expect(input.type).toBe("text");
	});

	it("renders with custom type", () => {
		render(<Input data-testid="input-field" type="email" />);
		const input = screen.getByTestId("input-field") as HTMLInputElement;
		expect(input.type).toBe("email");
	});

	it("renders with placeholder", () => {
		render(<Input data-testid="input-field" placeholder="Enter text" />);
		const input = screen.getByTestId("input-field") as HTMLInputElement;
		expect(input.placeholder).toBe("Enter text");
	});

	it("applies additional className", () => {
		render(<Input data-testid="input-field" className="custom-class" />);
		const input = screen.getByTestId("input-field");
		expect(input).toHaveClass("custom-class");
	});

	it("handles value and onChange", () => {
		const handleChange = vi.fn();
		render(
			<Input data-testid="input-field" value="test" onChange={handleChange} />,
		);

		const input = screen.getByTestId("input-field") as HTMLInputElement;
		expect(input.value).toBe("test");

		fireEvent.change(input, { target: { value: "new value" } });
		expect(handleChange).toHaveBeenCalled();
	});

	it("is disabled when disabled prop is set", () => {
		render(<Input data-testid="input-field" disabled />);
		const input = screen.getByTestId("input-field");
		expect(input).toBeDisabled();
	});

	it("renders with required attribute", () => {
		render(<Input data-testid="input-field" required />);
		const input = screen.getByTestId("input-field") as HTMLInputElement;
		expect(input.required).toBe(true);
	});

	it("renders with different input types", () => {
		const types = ["text", "email", "password", "number", "date"];
		types.forEach((type) => {
			const { unmount } = render(
				<Input data-testid={`input-${type}`} type={type} />,
			);
			const input = screen.getByTestId(`input-${type}`) as HTMLInputElement;
			expect(input.type).toBe(type);
			unmount();
		});
	});
});

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

describe("ColorPicker", () => {
	it("renders correctly", () => {
		render(<ColorPicker data-testid="color-input" />);
		const input = screen.getByTestId("color-input") as HTMLInputElement;
		expect(input).toBeInTheDocument();
		expect(input.type).toBe("color");
	});

	it("applies additional className", () => {
		render(<ColorPicker data-testid="color-input" className="custom-class" />);
		const input = screen.getByTestId("color-input") as HTMLInputElement;
		expect(input).toHaveClass("custom-class");
	});

	it("handles value and onChange", () => {
		const handleChange = vi.fn();
		render(
			<ColorPicker
				data-testid="color-input"
				value="#ff0000"
				onChange={handleChange}
			/>,
		);

		const input = screen.getByTestId("color-input") as HTMLInputElement;
		expect(input.value).toBe("#ff0000");

		fireEvent.change(input, { target: { value: "#00ff00" } });
		expect(handleChange).toHaveBeenCalled();
	});
});
