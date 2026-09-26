"use client";

import {
	FONT_OPTIONS,
	GIF_DELAY_PRESETS,
	type GifDelayPreset,
	SIZE_PRESETS,
} from "@cover-craft/shared";
import {
	Button,
	Card,
	ColorPicker,
	FormError,
	Input,
	SectionTitle,
	Select,
} from "@/components/ui";
import type { ContrastCheckResult, GifFormData } from "@/hooks";
import { ColorContrastMessage, FormField } from "./CoverFormControls";

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
	handleGenerate,
	handleReset,
}: GifSettingsControlsProps) {
	return (
		<Card className="w-full flex flex-col gap-6">
			<SectionTitle size="md">Canvas & Slideshow Settings</SectionTitle>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<FormField label="Size Preset" htmlFor="gif-size">
					<Select
						id="gif-size"
						value={formData.size}
						onChange={(e) => setSize(e.target.value)}
						aria-label="Select size preset for animated GIF"
					>
						{SIZE_PRESETS.map((p) => (
							<option key={p.label} value={p.label}>
								{p.label}
							</option>
						))}
					</Select>
				</FormField>

				<FormField label="Font" htmlFor="gif-font">
					<Select
						id="gif-font"
						value={formData.font}
						onChange={(e) =>
							setFont(e.target.value as (typeof FONT_OPTIONS)[number])
						}
						aria-label="Select font for all slides"
					>
						{FONT_OPTIONS.map((f) => (
							<option key={f} value={f}>
								{f}
							</option>
						))}
					</Select>
				</FormField>

				<FormField label="Filename" htmlFor="gif-filename">
					<Input
						id="gif-filename"
						placeholder="my-awesome-slideshow"
						value={formData.filename}
						onChange={(e) => setFilename(e.target.value)}
						aria-label="Filename for generated animated GIF (optional)"
					/>
				</FormField>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
				<div className="flex flex-col gap-4">
					<ColorContrastMessage contrastCheck={contrastCheck} />

					<div className="flex flex-col sm:flex-row gap-4 sm:items-end">
						<div className="flex-1">
							<FormField
								label="Background Color"
								htmlFor="gif-background-color"
							>
								<ColorPicker
									id="gif-background-color"
									value={formData.backgroundColor}
									onChange={(e) => setBackgroundColor(e.target.value)}
									title="Choose background color for your slideshow"
									aria-label="Background color picker"
								/>
							</FormField>
						</div>

						<div className="flex-1">
							<FormField label="Text Color" htmlFor="gif-text-color">
								<ColorPicker
									id="gif-text-color"
									value={formData.textColor}
									onChange={(e) => setTextColor(e.target.value)}
									title="Choose text color for your slideshow"
									aria-label="Text color picker"
								/>
							</FormField>
						</div>

						<Button
							variant="outline"
							onClick={handleRandomizeColors}
							aria-label="Randomize background and text colors"
							type="button"
							className="shrink-0"
						>
							Randomize Colors
						</Button>
					</div>
				</div>

				<div className="flex flex-col gap-4">
					<FormField label="Slide Delay (ms)">
						<div className="flex flex-wrap gap-4 pt-2">
							{GIF_DELAY_PRESETS.map((delay) => (
								<label
									key={delay}
									className="flex items-center gap-2 text-sm font-medium text-gray-800 cursor-pointer"
								>
									<input
										type="checkbox"
										name="delayMs"
										checked={formData.delayMs === delay}
										onChange={() => setDelayMs(delay)}
										className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
										aria-label={`Set slide delay to ${delay} milliseconds`}
									/>
									<span>{delay} ms</span>
								</label>
							))}
						</div>
					</FormField>

					<div className="flex items-center gap-2 py-1">
						<input
							type="checkbox"
							id="gif-border"
							checked={formData.hasBorder}
							onChange={(e) => setHasBorder(e.target.checked)}
							className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
							aria-label="Add border to all slides"
						/>
						<label
							htmlFor="gif-border"
							className="text-sm font-medium text-gray-800 cursor-pointer"
						>
							Add Border
						</label>
					</div>
				</div>
			</div>

			<FormError error={error} />

			{(() => {
				const hasEmptyTitle = formData.slides.some(
					(s) => !s.title || s.title.trim() === "",
				);
				const isDisabled =
					hasEmptyTitle || isGenerating || !contrastCheck.meetsWCAG;

				return (
					<div className="flex justify-center gap-3 pt-2">
						<Button
							onClick={handleGenerate}
							disabled={isDisabled}
							isLoading={isGenerating}
							title={
								!contrastCheck.meetsWCAG
									? `Cannot generate: ${contrastCheck.message}`
									: undefined
							}
							aria-label="Generate animated GIF slideshow"
						>
							{isGenerating ? "Generating..." : "Generate GIF"}
						</Button>
						<Button
							variant="outline"
							onClick={handleReset}
							aria-label="Reset slideshow form"
						>
							Reset
						</Button>
					</div>
				);
			})()}
		</Card>
	);
}
