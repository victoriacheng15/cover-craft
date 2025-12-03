/**
 * Color Contrast Validation Utilities
 * Implements WCAG contrast ratio calculations for accessibility compliance
 */

// Convert hex color to RGB values
// hex: Hex color string (e.g., "#ffffff" or "#fff")
// Returns object with r, g, b values (0-255)
export function hexToRgb(
  hex: string,
): { r: number; g: number; b: number } | null {
  // Remove # if present
  const cleanHex = hex.replace(/^#/, "");

  // Handle 3-digit hex
  const hexStr =
    cleanHex.length === 3
      ? cleanHex
          .split("")
          .map((char) => char + char)
          .join("")
      : cleanHex;

  // Validate hex format
  if (!/^[0-9A-Fa-f]{6}$/.test(hexStr)) {
    return null;
  }

  const r = parseInt(hexStr.substring(0, 2), 16);
  const g = parseInt(hexStr.substring(2, 4), 16);
  const b = parseInt(hexStr.substring(4, 6), 16);

  return { r, g, b };
}

// Calculate relative luminance of a color
// Uses WCAG formula: https://www.w3.org/TR/WCAG20/#relativeluminancedef
// rgb: RGB object with r, g, b values (0-255)
// Returns luminance value (0-1)
export function getRelativeLuminance(rgb: {
  r: number;
  g: number;
  b: number;
}): number {
  // Convert to sRGB
  const [rs, gs, bs] = [rgb.r, rgb.g, rgb.b].map((value) => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });

  // Calculate luminance
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Calculate contrast ratio between two colors
// Uses WCAG formula: https://www.w3.org/TR/WCAG20/#contrast-ratiodef
// color1: First hex color
// color2: Second hex color
// Returns contrast ratio (1-21)
export function getContrastRatio(
  color1: string,
  color2: string,
): number | null {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    return null;
  }

  const lum1 = getRelativeLuminance(rgb1);
  const lum2 = getRelativeLuminance(rgb2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

// WCAG compliance levels
export const WCAG_LEVELS = {
  AA: 4.5, // Normal text (14px or smaller)
  AAA: 7, // Enhanced contrast
  FAIL: 4.5, // Below AA
} as const;

// Determine WCAG compliance level
// contrastRatio: Contrast ratio (1-21)
// Returns compliance level: "AAA" | "AA" | "FAIL"
export function getWCAGLevel(contrastRatio: number): "AAA" | "AA" | "FAIL" {
  if (contrastRatio >= WCAG_LEVELS.AAA) {
    return "AAA";
  }
  if (contrastRatio >= WCAG_LEVELS.AA) {
    return "AA";
  }
  return "FAIL";
}

// Check if contrast ratio meets WCAG AA standard
// contrastRatio: Contrast ratio (1-21)
// Returns true if meets or exceeds WCAG AA (4.5:1)
export function meetsWCAGAA(contrastRatio: number): boolean {
  return contrastRatio >= WCAG_LEVELS.AA;
}

// Get color status and message for display
// backgroundColor: Background hex color
// textColor: Text hex color
// Returns object with status, ratio, and level
export function getContrastStatus(
  backgroundColor: string,
  textColor: string,
): {
  status: "good" | "warning" | "poor";
  ratio: number | null;
  level: "AAA" | "AA" | "FAIL" | null;
  message: string;
} {
  const ratio = getContrastRatio(backgroundColor, textColor);

  if (ratio === null) {
    return {
      status: "poor",
      ratio: null,
      level: null,
      message: "Invalid color format",
    };
  }

  const level = getWCAGLevel(ratio);
  const status =
    level === "FAIL" ? "poor" : level === "AA" ? "warning" : "good";

  const messages: Record<string, string> = {
    AAA: `${ratio.toFixed(2)}:1 ✓ AAA (Enhanced)`,
    AA: `${ratio.toFixed(2)}:1 ✓ AA (Standard)`,
    FAIL: `${ratio.toFixed(2)}:1 ✗ Below AA (Poor)`,
  };

  return {
    status,
    ratio,
    level,
    message: messages[level],
  };
}
