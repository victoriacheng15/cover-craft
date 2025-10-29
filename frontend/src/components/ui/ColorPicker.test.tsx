import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ColorPicker from "./ColorPicker";

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
    render(<ColorPicker data-testid="color-input" value="#ff0000" onChange={handleChange} />);

    const input = screen.getByTestId("color-input") as HTMLInputElement;
    expect(input.value).toBe("#ff0000");

    fireEvent.change(input, { target: { value: "#00ff00" } });
    expect(handleChange).toHaveBeenCalled();
  });
});
