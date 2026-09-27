"use client";

import { Button, ColorPicker } from "@/components/ui";
import type { ContrastCheckResult } from "@/hooks";
import { cn } from "@/lib/utils";
import { FormField } from "./CoverFormControls";

export interface ColorContrastMessageProps {
	contrastCheck: ContrastCheckResult;
	stacked?: boolean;
	className?: string;
}

export function ColorContrastMessage({
	contrastCheck,
	stacked = false,
	className = "",
}: ColorContrastMessageProps) {
	function getContrastColorClasses(status: "good" | "warning" | "poor") {
		const colorMap: Record<
			"good" | "warning" | "poor",
			{ dot: string; text: string }
		> = {
			good: { dot: "bg-emerald-500", text: "text-emerald-700" },
			warning: { dot: "bg-yellow-500", text: "text-yellow-700" },
			poor: { dot: "bg-red-500", text: "text-red-700" },
		};
		return colorMap[status];
	}

	if (stacked) {
		return (
			<div
				className={cn(
					"p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 flex flex-col items-center justify-center text-center min-h-16",
					className,
				)}
			>
				<p className="text-xs font-medium text-emerald-900">Color Contrast</p>
				<output
					className="flex items-center justify-center gap-1.5 mt-0.5"
					aria-live="polite"
					aria-atomic="true"
				>
					{contrastCheck.status && (
						<>
							<span
								className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${getContrastColorClasses(contrastCheck.status).dot}`}
								aria-hidden="true"
							/>
							<p
								className={`text-xs font-semibold truncate ${getContrastColorClasses(contrastCheck.status).text}`}
							>
								{contrastCheck.message}
							</p>
							<span className="sr-only">
								Contrast status is {contrastCheck.status}
							</span>
						</>
					)}
				</output>
			</div>
		);
	}

	return (
		<div
			className={cn(
				"p-3 bg-emerald-50 rounded-xl border border-emerald-100",
				className,
			)}
		>
			<div className="flex items-center justify-between">
				<p className="text-sm font-medium text-emerald-900">Color Contrast</p>
				<output
					className="flex items-center gap-2"
					aria-live="polite"
					aria-atomic="true"
				>
					{contrastCheck.status && (
						<>
							<span
								className={`inline-block w-3 h-3 rounded-full ${getContrastColorClasses(contrastCheck.status).dot}`}
								aria-hidden="true"
							/>
							<p
								className={`text-sm font-semibold ${getContrastColorClasses(contrastCheck.status).text}`}
							>
								{contrastCheck.message}
							</p>
							<span className="sr-only">
								Contrast status is {contrastCheck.status}
							</span>
						</>
					)}
				</output>
			</div>
		</div>
	);
}

export interface SharedColorControlsProps {
	backgroundColor: string;
	textColor: string;
	onBackgroundColorChange: (color: string) => void;
	onTextColorChange: (color: string) => void;
	onRandomizeColors: () => void;
	contrastCheck?: ContrastCheckResult;
	idPrefix?: string;
	titleContext?: string;
	className?: string;
	colorRowClassName?: string;
}

export function SharedColorControls({
	backgroundColor,
	textColor,
	onBackgroundColorChange,
	onTextColorChange,
	onRandomizeColors,
	contrastCheck,
	idPrefix,
	titleContext = "cover",
	className = "flex flex-col gap-4",
	colorRowClassName = "flex flex-col sm:flex-row gap-4 sm:items-end",
}: SharedColorControlsProps) {
	const bgId = idPrefix ? `${idPrefix}-background-color` : "background-color";
	const textId = idPrefix ? `${idPrefix}-text-color` : "text-color";

	return (
		<div className={className}>
			{contrastCheck && <ColorContrastMessage contrastCheck={contrastCheck} />}

			<div className={colorRowClassName}>
				<div className="flex-1">
					<FormField label="Background Color" htmlFor={bgId}>
						<ColorPicker
							id={bgId}
							value={backgroundColor}
							onChange={(e) => onBackgroundColorChange(e.target.value)}
							title={`Choose background color for your ${titleContext}`}
							aria-label="Background color picker"
						/>
					</FormField>
				</div>

				<div className="flex-1">
					<FormField label="Text Color" htmlFor={textId}>
						<ColorPicker
							id={textId}
							value={textColor}
							onChange={(e) => onTextColorChange(e.target.value)}
							title={`Choose text color for your ${titleContext}`}
							aria-label="Text color picker"
						/>
					</FormField>
				</div>

				<Button
					variant="outline"
					onClick={onRandomizeColors}
					aria-label="Randomize background and text colors"
					type="button"
					className="shrink-0"
				>
					Randomize Colors
				</Button>
			</div>
		</div>
	);
}
