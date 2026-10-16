"use client";

import {
	type BorderLines,
	type BorderStyle,
	type FONT_OPTIONS,
	GIF_DELAY_PRESETS,
	type GifDelayPreset,
	SIZE_PRESETS,
} from "@cover-craft/shared";
import type { ContrastCheckResult, GifFormData } from "@/hooks";
import { CanvasSettingsCard } from "./CanvasSettingsCard";

export interface GifSettingsControlsProps {
	formData: GifFormData;
	contrastCheck: ContrastCheckResult;
	isGenerating?: boolean;
	error?: string | null;
	setSize: (size: string) => void;
	setBackgroundColor: (color: string) => void;
	setTextColor: (color: string) => void;
	handleRandomizeColors: () => void;
	setDelayMs: (delay: GifDelayPreset) => void;
	setFilename: (filename: string) => void;
	setFont: (font: (typeof FONT_OPTIONS)[number]) => void;
	setHasBorder: (hasBorder: boolean) => void;
	setBorderStyle?: (style: BorderStyle) => void;
	setBorderLines?: (lines: BorderLines) => void;
	handleGenerate: () => void;
	handleReset: () => void;
}

export function GifSettingsControls({
	formData,
	contrastCheck,
	isGenerating = false,
	error = null,
	setSize,
	setBackgroundColor,
	setTextColor,
	handleRandomizeColors,
	setDelayMs,
	setFilename,
	setFont,
	setHasBorder,
	setBorderStyle,
	setBorderLines,
	handleGenerate,
	handleReset,
}: GifSettingsControlsProps) {
	const hasEmptyTitle = formData.slides.some(
		(s) => !s.title || s.title.trim() === "",
	);
	const isDisabled = hasEmptyTitle || !contrastCheck.meetsWCAG;

	return (
		<CanvasSettingsCard
			title="Canvas & Slideshow Settings"
			sizeId="gif-size"
			sizeValue={formData.size}
			sizeOptions={SIZE_PRESETS}
			onSizeChange={setSize}
			sizeAriaLabel="Select size preset for animated GIF"
			fontId="gif-font"
			fontValue={formData.font}
			onFontChange={setFont}
			fontAriaLabel="Select font for all slides"
			filenameId="gif-filename"
			filenameValue={formData.filename}
			filenamePlaceholder="my-awesome-slideshow"
			onFilenameChange={setFilename}
			filenameAriaLabel="Filename for generated animated GIF (optional)"
			backgroundColor={formData.backgroundColor}
			textColor={formData.textColor}
			onBackgroundColorChange={setBackgroundColor}
			onTextColorChange={setTextColor}
			onRandomizeColors={handleRandomizeColors}
			contrastCheck={contrastCheck}
			colorIdPrefix="gif"
			colorTitleContext="slideshow"
			borderStyle={formData.borderStyle}
			borderLines={formData.borderLines}
			onBorderStyleChange={(style) => {
				if (setBorderStyle) {
					setBorderStyle(style);
				} else {
					setHasBorder(style !== "none");
				}
			}}
			onBorderLinesChange={(lines) => {
				if (setBorderLines) {
					setBorderLines(lines);
				}
			}}
			extraSettings={
				<div className="flex flex-col sm:flex-row sm:items-center gap-3">
					<span className="text-sm font-medium text-gray-900 shrink-0">
						Slide Delay:
					</span>
					<fieldset
						aria-label="Slide Delay"
						className="inline-flex p-1 bg-gray-100 rounded-xl border border-gray-200 gap-1 flex-wrap m-0"
					>
						{GIF_DELAY_PRESETS.map((delay) => {
							const isActive = formData.delayMs === delay;
							const label = `${delay / 1000}s`;
							return (
								<button
									key={delay}
									type="button"
									onClick={() => setDelayMs(delay)}
									aria-pressed={isActive}
									aria-label={label}
									className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
										isActive
											? "bg-white text-emerald-700 shadow-xs font-bold"
											: "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
									}`}
								>
									{label}
								</button>
							);
						})}
					</fieldset>
				</div>
			}
			error={error}
			isGenerating={isGenerating}
			generateDisabled={isDisabled}
			generateButtonLabel="Generate GIF"
			generateButtonTitle={
				!contrastCheck.meetsWCAG
					? `Cannot generate: ${contrastCheck.message}`
					: undefined
			}
			generateButtonAriaLabel="Generate animated GIF slideshow"
			onGenerate={handleGenerate}
			onReset={handleReset}
			resetAriaLabel="Reset slideshow form"
		/>
	);
}
