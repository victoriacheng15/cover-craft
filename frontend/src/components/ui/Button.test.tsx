import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Button from "./Button";

describe("Button", () => {
	it("renders children correctly", () => {
		render(<Button>Click Me</Button>);
		expect(screen.getByText("Click Me")).toBeInTheDocument();
	});

	it("calls onClick when clicked", () => {
		const handleClick = vi.fn();
		render(<Button onClick={handleClick}>Click Me</Button>);

		fireEvent.click(screen.getByText("Click Me"));
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it("is disabled when disabled prop is set", () => {
		render(<Button disabled>Click Me</Button>);
		expect(screen.getByText("Click Me")).toBeDisabled();
	});
});
