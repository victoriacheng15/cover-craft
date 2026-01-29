"use client";

import { useForm } from "@/hooks";
import { lato, montserrat, openSans, playfairDisplay, roboto } from "@/lib";
import CoverFormControls from "./CoverFormControls";
import CoverPreviewDisplay from "./CoverPreviewDisplay";

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
		handleRandomizeColors,
		contrastCheck,
	} = useForm();

	return (
		<div
			className={`w-full flex flex-col md:flex-row gap-6 ${montserrat.variable} ${roboto.variable} ${lato.variable} ${playfairDisplay.variable} ${openSans.variable}`}
		>
			<CoverFormControls
				formData={formData}
				handleInputChange={handleInputChange}
				error={error}
				isGenerating={isGenerating}
				contrastCheck={contrastCheck}
				handleGenerate={handleGenerate}
				handleReset={handleReset}
				handleRandomizeColors={handleRandomizeColors}
			/>

			<CoverPreviewDisplay
				formData={formData}
				generatedImageUrl={generatedImageUrl}
				getPreviewDimensions={getPreviewDimensions}
				handleDownload={handleDownload}
			/>
		</div>
	);
}
