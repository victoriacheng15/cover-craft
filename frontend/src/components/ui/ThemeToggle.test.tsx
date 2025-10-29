import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ThemeToggle from "./ThemeToggle";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock matchMedia globally
beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("renders correctly", () => {
    render(<ThemeToggle data-testid="theme-toggle" />);
    const button = screen.getByRole("button", { name: /toggle theme/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-label", "Toggle Theme");
  });

  it("shows light emoji initially when no stored theme", () => {
    render(<ThemeToggle data-testid="theme-toggle" />);
    const button = screen.getByRole("button", { name: /toggle theme/i });
    expect(button.textContent).toContain("🌞");
  });

  it("applies stored dark theme from localStorage", () => {
    localStorage.setItem("theme", "dark");
    document.documentElement.classList.add("dark");
    render(<ThemeToggle data-testid="theme-toggle" />);
    const button = screen.getByRole("button", { name: /toggle theme/i });
    expect(button.textContent).toContain("🌙");
  });

  it("toggles theme when clicked and updates document class and localStorage", () => {
    render(<ThemeToggle data-testid="theme-toggle" />);
    const button = screen.getByRole("button", { name: /toggle theme/i });

    // Initial state
    expect(button.textContent).toContain("🌞");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("theme")).toBe(null);

    // Click to dark
    fireEvent.click(button);
    expect(button.textContent).toContain("🌙");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("theme")).toBe("dark");

    // Click back to light
    fireEvent.click(button);
    expect(button.textContent).toContain("🌞");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("respects system preference when no stored theme", () => {
    (window.matchMedia as any).mockImplementation((query: string) => ({
      matches: query === "(prefers-color-scheme: dark)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(<ThemeToggle data-testid="theme-toggle" />);
    const button = screen.getByRole("button", { name: /toggle theme/i });
    expect(button.textContent).toContain("🌙");
  });
});
