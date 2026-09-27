"use client";

import {
	type FONT_OPTIONS,
	GIF_DELAY_PRESETS,
	type GifDelayPreset,
	SIZE_PRESETS,
} from "@cover-craft/shared";
import {
	Button,
	Card,
	FormError,
	Input,
	SectionTitle,
	Select,
} from "@/components/ui";
import type { ContrastCheckResult, GifFormData } from "@/hooks";
import { FormField } from "./CoverFormControls";
import { FontSelect } from "./FontSelect";
import { SharedColorControls } from "./SharedColorControls";

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

				<FontSelect
					id="gif-font"
					value={formData.font}
					onChange={setFont}
					ariaLabel="Select font for all slides"
				/>

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
				<SharedColorControls
					idPrefix="gif"
					backgroundColor={formData.backgroundColor}
					textColor={formData.textColor}
					onBackgroundColorChange={setBackgroundColor}
					onTextColorChange={setTextColor}
					onRandomizeColors={handleRandomizeColors}
					contrastCheck={contrastCheck}
					titleContext="slideshow"
				/>

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
