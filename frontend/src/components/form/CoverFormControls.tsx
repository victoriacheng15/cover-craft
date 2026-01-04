"use client";

import {
	Button,
	Card,
	ColorPicker,
	Input,
	SectionTitle,
	Select,
} from "@/components/ui";
import { FONT_OPTIONS, SIZE_PRESETS } from "@/hooks";
import type { ContrastCheckResult } from "@/hooks/useContrastCheck";
import type { FormData } from "@/hooks/useForm";
import { MAX_SUBTITLE_LENGTH, MAX_TITLE_LENGTH } from "@/shared/validators";
import FormField from "./FormField";

interface CoverFormControlsProps {
	formData: FormData;
	handleInputChange: (key: keyof FormData, value: string) => void;
	error: string | null;
	isGenerating: boolean;
	contrastCheck: ContrastCheckResult;
	handleGenerate: () => void;
	handleReset: () => void;
}

export default function CoverFormControls({
	formData,
	handleInputChange,
	error,
	isGenerating,
	contrastCheck,
	handleGenerate,
	handleReset,
}: CoverFormControlsProps) {
	const errorId = "form-error-message";

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

			<div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
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
								></span>
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

			<div className="flex gap-4">
				<div className="flex-1">
					<FormField label="Background Color" htmlFor="background-color">
						<ColorPicker
							id="background-color"
							value={formData.backgroundColor}
							onChange={(e) =>
								handleInputChange("backgroundColor", e.target.value)
							}
							title="Choose background color for your cover"
							aria-label="Background color picker"
						/>
					</FormField>
				</div>

				<div className="flex-1">
					<FormField label="Text Color" htmlFor="text-color">
						<ColorPicker
							id="text-color"
							value={formData.textColor}
							onChange={(e) => handleInputChange("textColor", e.target.value)}
							title="Choose text color for your cover"
							aria-label="Text color picker"
						/>
					</FormField>
				</div>
			</div>

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

			{error && (
				<div
					className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl"
					role="alert"
					id={errorId}
					aria-live="polite"
				>
					<p className="text-sm font-medium">{error}</p>
				</div>
			)}

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
