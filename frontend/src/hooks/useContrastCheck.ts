import { getContrastStatus } from "@cover-craft/shared";
import { useEffect, useMemo, useState } from "react";

export interface ContrastCheckResult {
	status: "good" | "warning" | "poor";
	ratio: number | null;
	level: "AAA" | "AA" | "FAIL" | null;
	message: string;
	meetsWCAG: boolean;
}

export function useContrastCheck(
	backgroundColor: string,
	textColor: string,
	debounceMs: number = 300,
): ContrastCheckResult {
	const [debouncedColors, setDebouncedColors] = useState({
		backgroundColor,
		textColor,
	});

	// Debounce the color changes
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedColors({ backgroundColor, textColor });
		}, debounceMs);

		return () => clearTimeout(timer);
	}, [backgroundColor, textColor, debounceMs]);

	// Calculate contrast with debounced colors
	return useMemo(() => {
		const { status, ratio, level, message } = getContrastStatus(
			debouncedColors.backgroundColor,
			debouncedColors.textColor,
		);

		return {
			status,
			ratio,
			level,
			message,
			meetsWCAG: status !== "poor",
		};
	}, [debouncedColors]);
}
