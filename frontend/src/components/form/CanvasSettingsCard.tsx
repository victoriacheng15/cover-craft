"use client";

import {
	type AllowedFont,
	BORDER_LINES,
	BORDER_STYLES,
	type BorderLines,
	type BorderStyle,
} from "@cover-craft/shared";
import {
	Button,
	Card,
	FormError,
	Input,
	SectionTitle,
	SegmentedGroup,
	Select,
} from "@/components/ui";
import type { ContrastCheckResult } from "@/hooks";
import { FormField } from "./CoverFormControls";
import { FontSelect } from "./FontSelect";
import { SharedColorControls } from "./SharedColorControls";

export interface CanvasSettingsCardProps {
	title: string;

	// Size Preset
	sizeId: string;
	sizeValue: string;
	sizeOptions: Array<{ label: string; value?: string } | string>;
	onSizeChange: (size: string) => void;
	sizeAriaLabel?: string;

	// Typography
	fontId: string;
	fontValue: AllowedFont;
	onFontChange: (font: AllowedFont) => void;
	fontAriaLabel?: string;

	// Export Filename
	filenameId: string;
	filenameValue: string;
	filenamePlaceholder?: string;
	filenameMaxLength?: number;
	onFilenameChange: (filename: string) => void;
	filenameAriaLabel?: string;

	// Color Palette & Contrast
	backgroundColor: string;
	textColor: string;
	onBackgroundColorChange: (color: string) => void;
	onTextColorChange: (color: string) => void;
	onRandomizeColors: () => void;
	contrastCheck: ContrastCheckResult;
	colorIdPrefix: string;
	colorTitleContext: string;

	// Dual-Control Borders
	borderStyle: BorderStyle;
	borderLines: BorderLines;
	onBorderStyleChange: (style: BorderStyle) => void;
	onBorderLinesChange: (lines: BorderLines) => void;

	// Generator-Specific Right-Column Modifiers (Slot)
	extraSettings?: React.ReactNode;

	// Generation & Reset Actions
	error?: string | null;
	errorId?: string;
	isGenerating?: boolean;
	generateDisabled?: boolean;
	generateButtonLabel?: string;
	generateButtonTitle?: string;
	generateButtonAriaLabel?: string;
	onGenerate: () => void;
	onReset: () => void;
	resetAriaLabel?: string;
}

export function CanvasSettingsCard({
	title,
	sizeId,
	sizeValue,
	sizeOptions,
	onSizeChange,
	sizeAriaLabel,
	fontId,
	fontValue,
	onFontChange,
	fontAriaLabel,
	filenameId,
	filenameValue,
	filenamePlaceholder = "filename",
	filenameMaxLength,
	onFilenameChange,
	filenameAriaLabel,
	backgroundColor,
	textColor,
	onBackgroundColorChange,
	onTextColorChange,
	onRandomizeColors,
	contrastCheck,
	colorIdPrefix,
	colorTitleContext,
	borderStyle,
	borderLines,
	onBorderStyleChange,
	onBorderLinesChange,
	extraSettings,
	error,
	errorId,
	isGenerating = false,
	generateDisabled = false,
	generateButtonLabel = "Generate",
	generateButtonTitle,
	generateButtonAriaLabel,
	onGenerate,
	onReset,
	resetAriaLabel = "Reset form to default values",
}: CanvasSettingsCardProps) {
	return (
		<Card className="w-full flex flex-col gap-6" aria-label={title}>
			<SectionTitle size="md">{title}</SectionTitle>

			{/* Row 1: Size Preset, Typography, Filename */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<FormField label="Size Preset" htmlFor={sizeId}>
					<Select
						id={sizeId}
						value={sizeValue}
						onChange={(e) => onSizeChange(e.target.value)}
						aria-label={sizeAriaLabel}
					>
						{sizeOptions.map((opt) => {
							const label = typeof opt === "string" ? opt : opt.label;
							const val =
								typeof opt === "string" ? opt : (opt.value ?? opt.label);
							return (
								<option key={val} value={val}>
									{label}
								</option>
							);
						})}
					</Select>
				</FormField>

				<FontSelect
					id={fontId}
					value={fontValue}
					onChange={onFontChange}
					ariaLabel={fontAriaLabel}
				/>

				<FormField label="Filename" htmlFor={filenameId}>
					<Input
						id={filenameId}
						placeholder={filenamePlaceholder}
						value={filenameValue}
						onChange={(e) => onFilenameChange(e.target.value)}
						maxLength={filenameMaxLength}
						aria-label={filenameAriaLabel}
					/>
				</FormField>
			</div>

			{/* Row 2: Left = Palette & Contrast, Right = Borders & Format Modifiers */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
				<SharedColorControls
					idPrefix={colorIdPrefix}
					backgroundColor={backgroundColor}
					textColor={textColor}
					onBackgroundColorChange={onBackgroundColorChange}
					onTextColorChange={onTextColorChange}
					onRandomizeColors={onRandomizeColors}
					contrastCheck={contrastCheck}
					titleContext={colorTitleContext}
				/>

				<div className="flex flex-col gap-4">
					<SegmentedGroup<BorderStyle>
						label="Border Pattern"
						options={BORDER_STYLES}
						value={borderStyle}
						onChange={onBorderStyleChange}
					/>

					<SegmentedGroup<BorderLines>
						label="Border Multiplicity"
						options={BORDER_LINES}
						value={borderLines}
						onChange={onBorderLinesChange}
						disabled={borderStyle === "none"}
					/>

					{extraSettings}
				</div>
			</div>

			<FormError error={error} errorId={errorId} />

			{/* Row 3: Action Bar */}
			<div className="flex justify-center gap-2">
				<Button
					onClick={onGenerate}
					disabled={generateDisabled || isGenerating}
					isLoading={isGenerating}
					title={generateButtonTitle}
					aria-label={generateButtonAriaLabel}
				>
					{isGenerating ? "Generating..." : generateButtonLabel}
				</Button>
				<Button
					variant="outline"
					onClick={onReset}
					disabled={isGenerating}
					aria-label={resetAriaLabel}
				>
					Reset
				</Button>
			</div>
		</Card>
	);
}
