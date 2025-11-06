import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock next/font/google to avoid issues in test environment
vi.mock("next/font/google", () => ({
  Montserrat: () => ({
    variable: "--font-montserrat",
    className: "font-montserrat",
  }),
  Roboto: () => ({ variable: "--font-roboto", className: "font-roboto" }),
  Lato: () => ({ variable: "--font-lato", className: "font-lato" }),
  Playfair_Display: () => ({
    variable: "--font-playfair-display",
    className: "font-playfair-display",
  }),
  Open_Sans: () => ({
    variable: "--font-open-sans",
    className: "font-open-sans",
  }),
}));
