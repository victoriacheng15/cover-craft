import { CAROUSEL_LIMITS } from "@cover-craft/shared";

/**
 * Detects bulleted or numbered list items from multiline text.
 * Returns an array of items (clamped between 2 and 5 items, max 70 chars each) or null.
 */
export function detectBulletList(text: string): string[] | null {
	if (!text || text.trim() === "") return null;

	const lines = text
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);

	if (lines.length < CAROUSEL_LIMITS.MIN_LIST_ITEMS) return null;

	const bulletPrefixRegex = /^(\s*[-*•]|\s*\d+[.)])\s+/;
	const matchesBullet = lines.some((line) => bulletPrefixRegex.test(line));

	if (!matchesBullet) return null;

	const cleanedItems: string[] = [];
	for (const line of lines) {
		const cleaned = line.replace(bulletPrefixRegex, "").trim();
		if (cleaned) {
			cleanedItems.push(cleaned.slice(0, CAROUSEL_LIMITS.MAX_LIST_ITEM_LENGTH));
		}
	}

	if (cleanedItems.length < CAROUSEL_LIMITS.MIN_LIST_ITEMS) return null;

	return cleanedItems.slice(0, CAROUSEL_LIMITS.MAX_LIST_ITEMS);
}

/**
 * Detects vertical text diagrams / architecture pipelines (e.g. connected via ↓, v, |, or ->).
 * Extracts pipeline stages into list items or null if no diagram pattern detected.
 */
export function detectTextDiagram(
	text: string,
): { isDiagram: boolean; steps: string[] } | null {
	if (!text || text.trim() === "") return null;

	const lines = text
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);

	if (lines.length < 3) return null;

	// Delimiter lines solely containing directional arrows or vertical flow connectors
	const arrowLineRegex = /^(↓|⬇|v|\||->|-->|=>|==>|→)$/i;
	const hasArrowLine = lines.some((line) => arrowLineRegex.test(line));

	if (!hasArrowLine) return null;

	const steps: string[] = [];
	for (const line of lines) {
		if (arrowLineRegex.test(line)) {
			continue;
		}
		steps.push(line.slice(0, CAROUSEL_LIMITS.MAX_LIST_ITEM_LENGTH));
	}

	if (steps.length < CAROUSEL_LIMITS.MIN_LIST_ITEMS) return null;

	return {
		isDiagram: true,
		steps: steps.slice(0, CAROUSEL_LIMITS.MAX_LIST_ITEMS),
	};
}
