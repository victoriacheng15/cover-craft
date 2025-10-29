import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Input from "./Input";

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
