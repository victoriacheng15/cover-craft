"use client";

import {
	FONT_OPTIONS,
	MAX_SUBTITLE_LENGTH,
	MAX_TITLE_LENGTH,
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
import type { ContrastCheckResult, FormData } from "@/hooks";
import { ColorContrastMessage, ColorControls, FormField } from "./index";

interface CoverFormControlsProps {
	formData: FormData;
	handleInputChange: (key: keyof FormData, value: string) => void;
	error: string | null;
	isGenerating: boolean;
	contrastCheck: ContrastCheckResult;
	handleGenerate: () => void;
	handleReset: () => void;
	handleRandomizeColors: () => void;
}

export default function CoverFormControls({
	formData,
	handleInputChange,
	error,
	isGenerating,
	contrastCheck,
	handleGenerate,
	handleReset,
	handleRandomizeColors,
}: CoverFormControlsProps) {
	const errorId = "form-error-message";

	function getGenerateButtonLabel() {
		if (isGenerating) return "Generating your cover image";
		if (!contrastCheck.meetsWCAG)
			return `Generate button disabled: ${contrastCheck.message}`;
		return "Generate cover image";
	}

	return (
		<Card
			className="min-w-[50%] flex-1 flex flex-col gap-4"
			aria-label="Cover image generator form"
		>
			<SectionTitle size="lg">Cover Details</SectionTitle>

			<FormField label="Size Preset" htmlFor="size-preset">
				<Select
					id="size-preset"
					value={formData.size}
					onChange={(e) => handleInputChange("size", e.target.value)}
					aria-label="Select cover image size preset"
				>
					{SIZE_PRESETS.map((preset) => (
						<option key={preset.label} value={preset.label}>
							{preset.label}
						</option>
					))}
				</Select>
			</FormField>

			<FormField label="Filename" htmlFor="filename">
				<Input
					id="filename"
					placeholder="my-awesome-cover"
					value={formData.filename}
					onChange={(e) => handleInputChange("filename", e.target.value)}
					aria-label="Enter filename for your cover image (optional)"
				/>
			</FormField>

			<FormField label="Title" htmlFor="title" required>
				<Input
					id="title"
					placeholder="Enter your cover title..."
					value={formData.title}
					onChange={(e) => handleInputChange("title", e.target.value)}
					maxLength={40}
					aria-label="Enter your cover title (required)"
					aria-describedby={error ? errorId : undefined}
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
					maxLength={70}
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

			<ColorContrastMessage contrastCheck={contrastCheck} />

			<ColorControls
				formData={formData}
				handleInputChange={handleInputChange}
				handleRandomizeColors={handleRandomizeColors}
			/>

			<FormField label="Font" htmlFor="font">
				<Select
					id="font"
					value={formData.font}
					onChange={(e) => handleInputChange("font", e.target.value)}
					aria-label="Select font for your cover text"
				>
					{FONT_OPTIONS.map((f) => (
						<option key={f} value={f}>
							{f}
						</option>
					))}
				</Select>
			</FormField>

			<FormError error={error} errorId={errorId} />

			<div className="flex justify-center gap-2">
				<Button
					onClick={handleGenerate}
					disabled={!formData.title || isGenerating || !contrastCheck.meetsWCAG}
					isLoading={isGenerating}
					title={
						!contrastCheck.meetsWCAG
							? `Cannot generate: ${contrastCheck.message}`
							: undefined
					}
					aria-label={getGenerateButtonLabel()}
				>
					{isGenerating ? "Generating..." : "Generate"}
				</Button>
				<Button
					variant="outline"
					onClick={handleReset}
					aria-label="Reset form to default values"
				>
					Reset
				</Button>
			</div>
		</Card>
	);
}
