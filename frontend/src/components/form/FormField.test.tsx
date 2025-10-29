import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import FormField from "./FormField";

describe("FormField", () => {
  it("renders label correctly", () => {
    render(
      <FormField label="Username">
        <input type="text" />
      </FormField>
    );

    const label = screen.getByText("Username");
    expect(label).toBeInTheDocument();
    expect(label.tagName).toBe("LABEL");
  });

  it("renders children correctly", () => {
    render(
      <FormField label="Email">
        <input type="email" />
      </FormField>
    );

    const input = screen.getByRole("textbox");
    expect(input).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <FormField label="Password" description="Must be at least 8 characters">
        <input type="password" />
      </FormField>
    );

    const description = screen.getByText("Must be at least 8 characters");
    expect(description).toBeInTheDocument();
  });

  it("renders error message when provided", () => {
    render(
      <FormField label="Password" error="Required field">
        <input type="password" />
      </FormField>
    );

    const error = screen.getByText("Required field");
    expect(error).toBeInTheDocument();
    expect(error).toHaveClass("text-red-500");
  });

  it("applies additional className", () => {
    render(
      <FormField label="Bio" className="custom-class">
        <textarea />
      </FormField>
    );

    const container = screen.getByText("Bio").parentElement;
    expect(container).toHaveClass("custom-class");
  });

  it("associates label with htmlFor correctly", () => {
    render(
      <FormField label="Username" htmlFor="username">
        <input id="username" />
      </FormField>
    );

    const label = screen.getByText("Username");
    const input = screen.getByRole("textbox");
    expect(label).toHaveAttribute("for", "username");
    expect(input).toHaveAttribute("id", "username");
  });
});
