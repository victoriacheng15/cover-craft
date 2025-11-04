import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Header from "./Header";

describe("Header", () => {
  it("renders the logo/title", () => {
    render(<Header />);
    const logo = screen.getByText(/Cover Craft 🎨/i);
    expect(logo).toBeInTheDocument();
  });

  it("applies correct Tailwind classes to header", () => {
    const { container } = render(<Header />);
    const header = container.querySelector("header");
    expect(header).toHaveClass(
      "sticky",
      "top-0",
      "z-50",
      "bg-emerald-200",
      "text-gray-900",
      "shadow-sm",
    );
  });

  it("centers the title", () => {
    const { container } = render(<Header />);
    const headerDiv = container.querySelector("header > div");
    expect(headerDiv).toHaveClass("text-center");
  });
});
