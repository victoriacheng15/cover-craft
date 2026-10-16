"use client";

import { useForm } from "@/hooks";
import {
	lato,
	montserrat,
	openSans,
	playfairDisplay,
	roboto,
} from "@/lib/utils";
import {
	CoverContentControls,
	CoverSettingsControls,
} from "./CoverFormControls";
import { CoverPreviewDisplay } from "./CoverPreviewDisplay";

export function CoverForm() {
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
			className={`w-full flex flex-col gap-6 ${montserrat.variable} ${roboto.variable} ${lato.variable} ${playfairDisplay.variable} ${openSans.variable}`}
		>
			{/* Top: Full-width Canvas & Cover Settings */}
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

			{/* Bottom: Side-by-side Cover Details and Live Preview */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
				<CoverContentControls
					formData={formData}
					handleInputChange={handleInputChange}
				/>

				<CoverPreviewDisplay
					formData={formData}
					generatedImageUrl={generatedImageUrl}
					getPreviewDimensions={getPreviewDimensions}
					handleDownload={handleDownload}
				/>
			</div>
		</div>
	);
}
