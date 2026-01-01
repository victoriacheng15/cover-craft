"use client";

import Image from "next/image";
import {
	Button,
	Card,
	ColorPicker,
	Input,
	SectionTitle,
	Select,
} from "@/components/ui";
import { FONT_OPTIONS, SIZE_PRESETS, useForm } from "@/hooks";
import {
	fontFamilyMap,
	lato,
	montserrat,
	openSans,
	playfairDisplay,
	roboto,
} from "@/lib";
import { MAX_SUBTITLE_LENGTH, MAX_TITLE_LENGTH } from "@/shared/validators";
import FormField from "./FormField";

export default function CoverForm() {
	const {
		formData,
		isGenerating,
		error,
		generatedImageUrl,
		handleInputChange,
		getPreviewDimensions,
		handleGenerate,
		handleDownload,
		handleReset,
		contrastCheck,
	} = useForm();

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
		<div
			className={`w-full flex flex-col md:flex-row gap-6 ${montserrat.variable} ${roboto.variable} ${lato.variable} ${playfairDisplay.variable} ${openSans.variable}`}
		>
			{/* Form Section */}
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
						<p className="text-sm font-medium text-emerald-900">
							Color Contrast
						</p>
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
						disabled={
							!formData.title || isGenerating || !contrastCheck.meetsWCAG
						}
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

			{/* Preview Section */}
			<Card
				className="w-full md:min-w-[300px] flex flex-col items-center"
				aria-label={
					generatedImageUrl
						? "Generated cover image"
						: "Live preview of cover image"
				}
				aria-live="polite"
			>
				{!generatedImageUrl ? (
					<>
						<SectionTitle size="lg">Live Preview</SectionTitle>
						<div
							className="flex justify-center items-center rounded-xl border border-gray-300 max-w-full"
							style={{
								backgroundColor: formData.backgroundColor,
								color: formData.textColor,
								fontFamily: fontFamilyMap[formData.font],
								width: `min(${getPreviewDimensions().width}px, 100%)`,
								height: `auto`,
								aspectRatio: `${getPreviewDimensions().width} / ${getPreviewDimensions().height}`,
							}}
							role="img"
							aria-label={`Preview: ${formData.title || "Title"} - ${formData.subtitle || "Subtitle"}`}
						>
							<div className="text-center px-4">
								<h2 className="text-2xl" style={{ fontWeight: 700 }}>
									{formData.title || "Title Preview"}
								</h2>
								<p className="text-lg" style={{ fontWeight: 400 }}>
									{formData.subtitle || "Subtitle Preview"}
								</p>
							</div>
						</div>
					</>
				) : (
					<>
						<SectionTitle size="lg">Generated Image</SectionTitle>
						<div className="w-full flex justify-center items-center">
							<Image
								src={generatedImageUrl || ""}
								alt={`Generated cover image: ${formData.title}`}
								width={getPreviewDimensions().width}
								height={getPreviewDimensions().height}
								className="max-w-full h-auto object-contain rounded-xl border border-gray-300"
								unoptimized
							/>
						</div>
						<div className="flex gap-2 mt-4">
							<Button
								onClick={handleDownload}
								aria-label={`Download generated cover image as ${formData.filename || "cover"}.png`}
							>
								Download
							</Button>
						</div>
					</>
				)}
			</Card>
		</div>
	);
}
