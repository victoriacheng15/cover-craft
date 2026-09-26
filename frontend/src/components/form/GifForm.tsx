"use client";

import { useGifForm } from "@/hooks";
import {
	lato,
	montserrat,
	openSans,
	playfairDisplay,
	roboto,
} from "@/lib/utils";
import { GifFormControls } from "./GifFormControls";
import { GifPreviewDisplay } from "./GifPreviewDisplay";
import { GifSettingsControls } from "./GifSettingsControls";

export function GifForm() {
	const {
		formData,
		isGenerating,
		error,
		generatedGifUrl,
		contrastCheck,
		setSize,
		setBackgroundColor,
		setTextColor,
		setDelayMs,
		setFilename,
		setFont,
		setHasBorder,
		activeSlideIndex,
		activeSlide,
		setActiveSlideIndex,
		addSlide,
		removeSlide,
		moveSlide,
		updateSlide,
		handleRandomizeColors,
		getPreviewDimensions,
		handleGenerate,
		handleDownload,
		handleReset,
	} = useGifForm();

	return (
		<div
			className={`w-full flex flex-col gap-6 ${montserrat.variable} ${roboto.variable} ${lato.variable} ${playfairDisplay.variable} ${openSans.variable}`}
		>
			{/* Full-width Canvas & Slideshow Settings */}
			<GifSettingsControls
				formData={formData}
				contrastCheck={contrastCheck}
				isGenerating={isGenerating}
				error={error}
				setSize={setSize}
				setBackgroundColor={setBackgroundColor}
				setTextColor={setTextColor}
				setDelayMs={setDelayMs}
				setFilename={setFilename}
				setFont={setFont}
				setHasBorder={setHasBorder}
				handleRandomizeColors={handleRandomizeColors}
				handleGenerate={handleGenerate}
				handleReset={handleReset}
			/>

			{/* Side-by-side: Slides Manager and Live Previews */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
				<GifFormControls
					formData={formData}
					activeSlideIndex={activeSlideIndex}
					activeSlide={activeSlide}
					setActiveSlideIndex={setActiveSlideIndex}
					addSlide={addSlide}
					removeSlide={removeSlide}
					moveSlide={moveSlide}
					updateSlide={updateSlide}
				/>

				<GifPreviewDisplay
					formData={formData}
					generatedGifUrl={generatedGifUrl}
					getPreviewDimensions={getPreviewDimensions}
					handleDownload={handleDownload}
				/>
			</div>
		</div>
	);
}
