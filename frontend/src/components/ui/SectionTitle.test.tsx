import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SectionTitle from "./SectionTitle";

describe("SectionTitle", () => {
  it("renders correctly", () => {
    render(<SectionTitle>Test Title</SectionTitle>);
    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });

  it("renders as h2 element", () => {
    render(<SectionTitle>Test Title</SectionTitle>);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toBeInTheDocument();
  });

  it("renders with default md size", () => {
    render(<SectionTitle data-testid="title">Test Title</SectionTitle>);
    const title = screen.getByTestId("title");
    expect(title).toHaveClass("text-lg");
    expect(title).toHaveClass("font-bold");
  });

  it("renders with sm size", () => {
    render(
      <SectionTitle data-testid="title" size="sm">
        Test Title
      </SectionTitle>,
    );
    const title = screen.getByTestId("title");
    expect(title).toHaveClass("text-sm");
    expect(title).toHaveClass("font-semibold");
  });

  it("renders with md size", () => {
    render(
      <SectionTitle data-testid="title" size="md">
        Test Title
      </SectionTitle>,
    );
    const title = screen.getByTestId("title");
    expect(title).toHaveClass("text-lg");
    expect(title).toHaveClass("font-bold");
  });

  it("renders with lg size", () => {
    render(
      <SectionTitle data-testid="title" size="lg">
        Test Title
      </SectionTitle>,
    );
    const title = screen.getByTestId("title");
    expect(title).toHaveClass("text-xl");
    expect(title).toHaveClass("font-bold");
  });

  it("applies additional className", () => {
    render(
      <SectionTitle data-testid="title" className="custom-class">
        Test Title
      </SectionTitle>,
    );
    const title = screen.getByTestId("title");
    expect(title).toHaveClass("custom-class");
  });

  it("renders with children correctly", () => {
    render(
      <SectionTitle>
        <span>Complex</span> Children
      </SectionTitle>,
    );
    expect(screen.getByText("Complex")).toBeInTheDocument();
    expect(screen.getByText("Children")).toBeInTheDocument();
  });

  it("accepts custom HTML attributes", () => {
    render(
      <SectionTitle
        data-testid="title"
        id="custom-id"
        aria-label="Custom Label"
      >
        Test Title
      </SectionTitle>,
    );
    const title = screen.getByTestId("title");
    expect(title).toHaveAttribute("id", "custom-id");
    expect(title).toHaveAttribute("aria-label", "Custom Label");
  });
});
