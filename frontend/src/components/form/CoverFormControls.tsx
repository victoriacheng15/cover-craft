"use client";

import {
	MAX_SUBTITLE_LENGTH,
	MAX_TITLE_LENGTH,
	SIZE_PRESETS,
} from "@cover-craft/shared";
import { Card, Input, SectionTitle } from "@/components/ui";
import type { ContrastCheckResult, FormData } from "@/hooks";
import { cn } from "@/lib/utils";
import { CanvasSettingsCard } from "./CanvasSettingsCard";
import {
	ColorContrastMessage,
	type ColorContrastMessageProps,
	SharedColorControls,
} from "./SharedColorControls";

interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
	label: string;
	error?: string;
	htmlFor?: string;
	required?: boolean;
	children: React.ReactNode;
}

export function FormField({
	className,
	label,
	error,
	htmlFor,
	required = false,
	children,
	...props
}: FormFieldProps) {
	return (
		<div className={cn("flex flex-col gap-1", className)} {...props}>
			<label
				htmlFor={htmlFor}
				className="block text-sm font-medium text-gray-900"
			>
				{label}
				{required && <span className="text-red-500 ml-1">*</span>}
			</label>
			{children}
			{error && (
				<p className="text-xs text-red-500" role="alert">
					{error}
				</p>
			)}
		</div>
	);
}

export { ColorContrastMessage, type ColorContrastMessageProps };

export interface ColorControlsProps {
	formData: FormData;
	handleInputChange: (key: keyof FormData, value: string) => void;
	handleRandomizeColors: () => void;
}

export function ColorControls({
	formData,
	handleInputChange,
	handleRandomizeColors,
}: ColorControlsProps) {
	return (
		<SharedColorControls
			backgroundColor={formData.backgroundColor}
			textColor={formData.textColor}
			onBackgroundColorChange={(color) =>
				handleInputChange("backgroundColor", color)
			}
			onTextColorChange={(color) => handleInputChange("textColor", color)}
			onRandomizeColors={handleRandomizeColors}
			titleContext="cover"
			colorRowClassName="flex gap-10 items-end"
		/>
	);
}

export interface CoverSettingsControlsProps {
	formData: FormData;
	handleInputChange: (key: keyof FormData, value: string | boolean) => void;
	error: string | null;
	isGenerating: boolean;
	contrastCheck: ContrastCheckResult;
	handleGenerate: () => void;
	handleReset: () => void;
	handleRandomizeColors: () => void;
}

export function CoverSettingsControls({
	formData,
	handleInputChange,
	error,
	isGenerating,
	contrastCheck,
	handleGenerate,
	handleReset,
	handleRandomizeColors,
}: CoverSettingsControlsProps) {
	const errorId = "form-error-message";

	function getGenerateButtonLabel() {
		if (isGenerating) return "Generating your cover image";
		if (!contrastCheck.meetsWCAG)
			return `Generate button disabled: ${contrastCheck.message}`;
		return "Generate cover image";
	}

	return (
		<CanvasSettingsCard
			title="Canvas & Cover Settings"
			sizeId="size-preset"
			sizeValue={formData.size}
			sizeOptions={SIZE_PRESETS}
			onSizeChange={(size) => handleInputChange("size", size)}
			sizeAriaLabel="Select cover image size preset"
			fontId="font"
			fontValue={formData.font}
			onFontChange={(font) => handleInputChange("font", font)}
			fontAriaLabel="Select font for your cover text"
			filenameId="filename"
			filenameValue={formData.filename}
			filenamePlaceholder="my-awesome-cover"
			onFilenameChange={(filename) => handleInputChange("filename", filename)}
			filenameAriaLabel="Enter filename for your cover image (optional)"
			backgroundColor={formData.backgroundColor}
			textColor={formData.textColor}
			onBackgroundColorChange={(color) =>
				handleInputChange("backgroundColor", color)
			}
			onTextColorChange={(color) => handleInputChange("textColor", color)}
			onRandomizeColors={handleRandomizeColors}
			contrastCheck={contrastCheck}
			colorIdPrefix="cover"
			colorTitleContext="cover"
			borderStyle={formData.borderStyle}
			borderLines={formData.borderLines}
			onBorderStyleChange={(style) => handleInputChange("borderStyle", style)}
			onBorderLinesChange={(lines) => handleInputChange("borderLines", lines)}
			error={error}
			errorId={errorId}
			isGenerating={isGenerating}
			generateDisabled={!formData.title || !contrastCheck.meetsWCAG}
			generateButtonLabel="Generate"
			generateButtonTitle={
				!contrastCheck.meetsWCAG
					? `Cannot generate: ${contrastCheck.message}`
					: undefined
			}
			generateButtonAriaLabel={getGenerateButtonLabel()}
			onGenerate={handleGenerate}
			onReset={handleReset}
			resetAriaLabel="Reset form to default values"
		/>
	);
}

export interface CoverContentControlsProps {
	formData: FormData;
	handleInputChange: (key: keyof FormData, value: string) => void;
}

export function CoverContentControls({
	formData,
	handleInputChange,
}: CoverContentControlsProps) {
	return (
		<Card className="w-full flex flex-col gap-4" aria-label="Cover Details">
			<SectionTitle size="md">Cover Details</SectionTitle>

			<FormField label="Title" htmlFor="title" required>
				<Input
					id="title"
					placeholder="Enter your cover title..."
					value={formData.title}
					onChange={(e) => handleInputChange("title", e.target.value)}
					maxLength={MAX_TITLE_LENGTH}
					aria-label="Enter your cover title (required)"
				/>
				<div className="flex justify-between items-center mt-1">
					<span className="text-xs text-gray-500"></span>
					<span
						className={`text-xs font-medium ${
							formData.title.length > MAX_TITLE_LENGTH - 4
								? "text-red-600"
								: formData.title.length > MAX_TITLE_LENGTH - 8
									? "text-orange-600"
									: "text-gray-500"
						}`}
					>
						{formData.title.length} / {MAX_TITLE_LENGTH}
					</span>
				</div>
			</FormField>

			<FormField label="Subtitle" htmlFor="subtitle">
				<Input
					id="subtitle"
					placeholder="Subtitle"
					value={formData.subtitle || ""}
					onChange={(e) => handleInputChange("subtitle", e.target.value)}
					maxLength={MAX_SUBTITLE_LENGTH}
					aria-label="Enter your cover subtitle (optional)"
				/>
				<div className="flex justify-between items-center mt-1">
					<span className="text-xs text-gray-500"></span>
					<span
						className={`text-xs font-medium ${
							(formData.subtitle?.length ?? 0) > MAX_SUBTITLE_LENGTH - 4
								? "text-red-600"
								: (formData.subtitle?.length ?? 0) > MAX_SUBTITLE_LENGTH - 14
									? "text-orange-600"
									: "text-gray-500"
						}`}
					>
						{formData.subtitle?.length ?? 0} / {MAX_SUBTITLE_LENGTH}
					</span>
				</div>
			</FormField>
		</Card>
	);
}

export interface CoverFormControlsProps extends CoverSettingsControlsProps {}

export function CoverFormControls({
	formData,
	handleInputChange,
	error,
	isGenerating,
	contrastCheck,
	handleGenerate,
	handleReset,
	handleRandomizeColors,
}: CoverFormControlsProps) {
	return (
		<div className="w-full flex flex-col gap-6">
			<CoverSettingsControls
				formData={formData}
				handleInputChange={handleInputChange}
				error={error}
				isGenerating={isGenerating}
				contrastCheck={contrastCheck}
				handleGenerate={handleGenerate}
				handleReset={handleReset}
				handleRandomizeColors={handleRandomizeColors}
			/>
			<CoverContentControls
				formData={formData}
				handleInputChange={handleInputChange}
			/>
		</div>
	);
}
