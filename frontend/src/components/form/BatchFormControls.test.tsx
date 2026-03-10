import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BatchFormControls from "./BatchFormControls";

describe("BatchFormControls", () => {
	const defaultProps = {
		jsonInput: "",
		setJsonInput: vi.fn(),
		isSubmitting: false,
		isValid: false,
		error: null,
		onSubmit: vi.fn(),
		onLookup: vi.fn(),
		onReset: vi.fn(),
		onFormat: vi.fn(),
	};

	it("renders all sections correctly", () => {
		render(<BatchFormControls {...defaultProps} />);

		expect(screen.getByText(/Look up existing job/i)).toBeInTheDocument();
		expect(screen.getByText(/Bulk Input \(JSON\)/i)).toBeInTheDocument();
		expect(
			screen.getByRole("textbox", { name: /JSON Payload/i }),
		).toBeInTheDocument();
		expect(screen.getByText(/Schema Reference/i)).toBeInTheDocument();
	});

	it("calls setJsonInput when typing in textarea", () => {
		render(<BatchFormControls {...defaultProps} />);
		const textarea = screen.getByRole("textbox", { name: /JSON Payload/i });

		fireEvent.change(textarea, { target: { value: "new value" } });
		expect(defaultProps.setJsonInput).toHaveBeenCalledWith("new value");
	});

	it("calls onFormat when clicking Format JSON button", () => {
		render(<BatchFormControls {...defaultProps} jsonInput="[ { } ]" />);
		const formatBtn = screen.getByRole("button", { name: /Format JSON/i });

		fireEvent.click(formatBtn);
		expect(defaultProps.onFormat).toHaveBeenCalled();
	});

	it("disables Generate Bulk button when invalid or empty", () => {
		const { rerender } = render(<BatchFormControls {...defaultProps} />);
		const submitBtn = screen.getByRole("button", { name: /Generate Bulk/i });

		expect(submitBtn).toBeDisabled();

		// Rerender with valid state
		rerender(
			<BatchFormControls {...defaultProps} jsonInput="[...]" isValid={true} />,
		);
		expect(submitBtn).not.toBeDisabled();
	});

	it("shows loading state on submit button", () => {
		render(<BatchFormControls {...defaultProps} isSubmitting={true} />);
		expect(screen.getByText(/Submitting.../i)).toBeInTheDocument();
	});

	it("calls onSubmit when clicking generate", () => {
		render(
			<BatchFormControls {...defaultProps} jsonInput="[...]" isValid={true} />,
		);
		const submitBtn = screen.getByRole("button", { name: /Generate Bulk/i });

		fireEvent.click(submitBtn);
		expect(defaultProps.onSubmit).toHaveBeenCalled();
	});

	it("calls onLookup with the entered ID", () => {
		render(<BatchFormControls {...defaultProps} />);
		const input = screen.getByPlaceholderText(/Paste Job ID/i);
		const trackBtn = screen.getByRole("button", { name: /Track/i });

		fireEvent.change(input, { target: { value: "test-id" } });
		fireEvent.click(trackBtn);

		expect(defaultProps.onLookup).toHaveBeenCalledWith("test-id");
	});

	it("displays error message when provided", () => {
		const errorMessage = "Invalid JSON syntax";
		render(<BatchFormControls {...defaultProps} error={errorMessage} />);

		expect(screen.getByRole("alert")).toHaveTextContent(errorMessage);
	});

	it("calls onReset when clicking reset", () => {
		render(<BatchFormControls {...defaultProps} />);
		const resetBtn = screen.getByRole("button", { name: /Reset/i });

		fireEvent.click(resetBtn);
		expect(defaultProps.onReset).toHaveBeenCalled();
	});
});
