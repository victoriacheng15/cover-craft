import { describe, it, expect, beforeAll, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Header from "./Header";

describe("Header", () => {
  beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });
  });

  it("renders the logo/title", () => {
    render(<Header />);
    const logo = screen.getByText(/Cover Craft 🎨/i);
    expect(logo).toBeInTheDocument();
  });

  it("renders GitHub link with correct attributes", () => {
    render(<Header />);
    const githubLink = screen.getByText(/GitHub/i).closest("a");
    expect(githubLink).toBeInTheDocument();
    expect(githubLink).toHaveAttribute("href", "https://github.com/your-repo");
    expect(githubLink).toHaveAttribute("target", "_blank");
    expect(githubLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders the ThemeToggle component", () => {
    render(<Header />);
    const button = screen.getByRole("button", { name: /toggle theme/i });
    expect(button).toBeInTheDocument();
  });

  it("applies correct Tailwind classes to header", () => {
    const { container } = render(<Header />);
    const header = container.querySelector("header");
    expect(header).toHaveClass(
      "sticky",
      "top-0",
      "z-50",
      "bg-gray-700",
      "dark:bg-gray-900",
      "text-gray-50",
      "shadow-sm"
    );
  });
});
