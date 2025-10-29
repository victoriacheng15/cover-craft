import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Footer from "./Footer";

describe("Footer", () => {
  it("renders copyright text", () => {
    render(<Footer />);
    const copyright = screen.getByText(/© 2025 Victoria Cheng/i);
    expect(copyright).toBeInTheDocument();
  });

  it("renders GitHub link with correct href and attributes", () => {
    render(<Footer />);
    const githubLink = screen.getByText(/GitHub/i).closest("a");
    expect(githubLink).toBeInTheDocument();
    expect(githubLink).toHaveAttribute("href", "https://github.com/your-repo");
    expect(githubLink).toHaveAttribute("target", "_blank");
    expect(githubLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("applies correct classes for styling", () => {
    const { container } = render(<Footer />);
    const footer = container.querySelector("footer");
    expect(footer).toHaveClass("bg-gray-700", "dark:bg-gray-900", "text-gray-50", "py-4", "mt-8");
  });
});
