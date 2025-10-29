import { describe, it, expect, beforeAll, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import MainLayout from "./MainLayout";

describe("MainLayout", () => {
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

  it("renders children, header, and footer", () => {
    render(
      <MainLayout>
        <div>Page Content</div>
      </MainLayout>
    );

    // Check children rendered
    expect(screen.getByText("Page Content")).toBeInTheDocument();

    // Check header title
    expect(screen.getByText(/Cover Craft/i)).toBeInTheDocument();

    // Check footer copyright
    expect(screen.getByText(/© 2025/i)).toBeInTheDocument();
  });
});
