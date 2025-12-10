/**
 * Shared validation constants and functions for Cover Craft.
 * Used by both backend (API) and frontend for consistent validation rules.
 *
 * ===================================================================================
 * CENTRALIZATION PLAN
 * ===================================================================================
 *
 * CURRENT STATE:
 * - Backend (API): Uses all validation functions and constants from this file
 * - Frontend: Has duplicate implementations of contrast functions and outdated constants
 *
 * DUPLICATE FUNCTIONS IN FRONTEND (frontend/src/lib/contrast.ts):
 * - hexToRgb() - convert hex to RGB
 * - getRelativeLuminance() - calculate color luminance
 * - getContrastRatio() - calculate contrast ratio between colors
 * - getWCAGLevel() - determine WCAG compliance level (similar to getWCAGLevelFromRatio)
 * - meetsWCAGAA() - check if ratio meets WCAG AA standard
 * - getContrastStatus() - return status object with ratio, level, and message
 *
 * DUPLICATE CONSTANTS IN FRONTEND:
 * - WCAG_LEVELS = { AA: 4.5, AAA: 7 } (frontend/src/lib/contrast.ts)
 * - FONT_OPTIONS array (frontend/src/hooks/useForm.ts) - mirrors ALLOWED_FONTS
 * - MAX_TITLE_LENGTH = 55 (frontend/src/hooks/useForm.ts) - OUTDATED, should be 40
 * - MAX_SUBTITLE_LENGTH = 120 (frontend/src/hooks/useForm.ts) - OUTDATED, should be 80
 *
 * NEXT STEPS (Phase 2 - Future):
 * 1. Update frontend tsconfig.json to add path alias for @/shared imports
 * 2. Frontend imports from shared/validations:
 *    - Replace contrast.ts functions with imports from shared
 *    - Use ALLOWED_FONTS instead of FONT_OPTIONS
 *    - Use MAX_TITLE_LENGTH and MAX_SUBTITLE_LENGTH from shared
 *    - Use WCAG_AA_THRESHOLD instead of WCAG_LEVELS
 * 3. Update frontend tests to use shared constants
 * 4. Delete duplicate contrast.ts implementations from frontend/src/lib/
 * 5. Ensure API can import from ../../../shared/validations (via copy:shared script)
 *
 * BENEFITS:
 * - Single source of truth for all validation logic and constants
 * - No more outdated frontend limits (55/120 vs 40/80)
 * - Reduced code duplication across frontend and backend
 * - Easier maintenance and bulk updates
 * - Consistent validation behavior across the entire application
 */

// ===================================================================================
// Validation Constants
// ===================================================================================

// Title and Subtitle length limits
export const MAX_TITLE_LENGTH = 55;
export const MAX_SUBTITLE_LENGTH = 120;

// Size constraints (in pixels)
export const SIZE_RANGE = { min: 1, max: 1200 };
export const SIZE_PRESETS = [
	{ label: "Post (1200 × 627)", width: 1200, height: 627 },
	{ label: "Square (1080 × 1080)", width: 1080, height: 1080 },
];

// FONT_OPTIONS
// note: backend uses this as ALLOWED_FONTS, and  will be renamed to FONT_OPTIONS
export const FONT_OPTIONS = [
	"Montserrat",
	"Roboto",
	"Lato",
	"Playfair Display",
	"Open Sans",
] as const;

// WCAG contrast ratio threshold
// note: backend uses WCAG_AA_CONTRAST_RATIO, and will be renamed to WCAG_AA_THRESHOLD
export const WCAG_AA_THRESHOLD = 4.5;

// HEX color regex (3 or 6 digit with #)
export const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

// Default filename if not provided
// the auto generate file name is in handleDownload in frontend/src/hooks/useForm.ts
export const DEFAULT_FILENAME = "cover";

// ===================================================================================
// Derived Types
// ===================================================================================

export type AllowedFont = (typeof FONT_OPTIONS)[number];

// ===================================================================================
// Validation Messages
// ===================================================================================

/**
 * Validation messages for consistent UX across frontend and backend.
 */
export const VALIDATION_MESSAGES = {
	TITLE_REQUIRED: "Title is required",
	TITLE_TOO_LONG: `Title must be ${MAX_TITLE_LENGTH} characters or less`,
	SUBTITLE_TOO_LONG: `Subtitle must be ${MAX_SUBTITLE_LENGTH} characters or less`,
	INVALID_WIDTH: `Width must be between ${SIZE_RANGE.min} and ${SIZE_RANGE.max}`,
	INVALID_HEIGHT: `Height must be between ${SIZE_RANGE.min} and ${SIZE_RANGE.max}`,
	INVALID_COLOR: "Color must be a valid HEX format (e.g., #FFFFFF or #FFF)",
	INVALID_FONT: `Font must be one of: ${FONT_OPTIONS.join(", ")}`,
	INVALID_CONTRAST: `Contrast ratio must be at least ${WCAG_AA_THRESHOLD} for WCAG AA compliance`,
} as const;

// ===================================================================================
// Validation Functions (Color & Contrast)
// ===================================================================================

export function hexToRgb(
	hex: string,
): { r: number; g: number; b: number } | null {
	const cleaned = hex.replace("#", "");
	if (!HEX_COLOR_REGEX.test(hex)) {
		return null;
	}

	const hexValue =
		cleaned.length === 3
			? cleaned
					.split("")
					.map((c) => c + c)
					.join("")
			: cleaned;

	const num = parseInt(hexValue, 16);
	return {
		r: (num >> 16) & 255,
		g: (num >> 8) & 255,
		b: num & 255,
	};
}

export function getRelativeLuminance(rgb: {
	r: number;
	g: number;
	b: number;
}): number {
	const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
		const normalized = c / 255;
		return normalized <= 0.03928
			? normalized / 12.92
			: ((normalized + 0.055) / 1.055) ** 2.4;
	});

	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

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

export function getWCAGLevelFromRatio(ratio: number): "AAA" | "AA" | "FAIL" {
	if (ratio >= 7) return "AAA";
	if (ratio >= WCAG_AA_THRESHOLD) return "AA";
	return "FAIL";
}

export function meetsWCAGAA(ratio: number): boolean {
	return ratio >= WCAG_AA_THRESHOLD;
}

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

	const level = getWCAGLevelFromRatio(ratio);
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

// ===================================================================================
// Field Validation Functions
// ===================================================================================

export interface ValidationError {
	field: string;
	message: string;
}

export function validateSize(
	width: number | undefined,
	height: number | undefined,
): ValidationError[] {
	const errors: ValidationError[] = [];

	if (
		width === undefined ||
		!Number.isInteger(width) ||
		Number.isNaN(width) ||
		width < SIZE_RANGE.min ||
		width > SIZE_RANGE.max
	) {
		errors.push({
			field: "width",
			message: `Width must be an integer between ${SIZE_RANGE.min} and ${SIZE_RANGE.max}`,
		});
	}

	if (
		height === undefined ||
		!Number.isInteger(height) ||
		Number.isNaN(height) ||
		height < SIZE_RANGE.min ||
		height > SIZE_RANGE.max
	) {
		errors.push({
			field: "height",
			message: `Height must be an integer between ${SIZE_RANGE.min} and ${SIZE_RANGE.max}`,
		});
	}

	return errors;
}

export function validateColors(
	backgroundColor: string,
	textColor: string,
): ValidationError[] {
	const errors: ValidationError[] = [];

	if (!HEX_COLOR_REGEX.test(backgroundColor)) {
		errors.push({
			field: "backgroundColor",
			message: "backgroundColor must be a valid hex color (e.g., #ffffff)",
		});
	}

	if (!HEX_COLOR_REGEX.test(textColor)) {
		errors.push({
			field: "textColor",
			message: "textColor must be a valid hex color (e.g., #000000)",
		});
	}

	return errors;
}

export function validateFont(font: string): ValidationError[] {
	const errors: ValidationError[] = [];

	if (!FONT_OPTIONS.includes(font as AllowedFont)) {
		errors.push({
			field: "font",
			message: `font must be one of: ${FONT_OPTIONS.join(", ")}`,
		});
	}

	return errors;
}

export function validateTextLength(
	title: string,
	subtitle?: string,
): ValidationError[] {
	const errors: ValidationError[] = [];

	if (title && title.length > MAX_TITLE_LENGTH) {
		errors.push({
			field: "title",
			message: `title must be ${MAX_TITLE_LENGTH} characters or less`,
		});
	}

	if (subtitle && subtitle.length > MAX_SUBTITLE_LENGTH) {
		errors.push({
			field: "subtitle",
			message: `subtitle must be ${MAX_SUBTITLE_LENGTH} characters or less`,
		});
	}

	return errors;
}

// the backend doesnt have a default filename like cover-timestamp.png from frontend (check useForm.ts handleDownload method), so move the default name from frontend to the backend
export function validateFilename(filename: string): ValidationError[] {
	const errors: ValidationError[] = [];

	if (!filename || filename.trim().length === 0) {
		errors.push({
			field: "filename",
			message: "Filename is required and cannot be empty",
		});
	}

	return errors;
}

export function validateContrast(
	backgroundColor: string,
	textColor: string,
): ValidationError[] {
	const errors: ValidationError[] = [];

	const ratio = getContrastRatio(backgroundColor, textColor);

	if (ratio === null || ratio < WCAG_AA_THRESHOLD) {
		const ratioStr = ratio ? ratio.toFixed(2) : "invalid";
		errors.push({
			field: "contrast",
			message: `Color contrast ratio ${ratioStr}:1 does not meet WCAG AA standard (4.5:1). Please choose colors with better contrast.`,
		});
	}

	return errors;
}
