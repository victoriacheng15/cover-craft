"use client";

import { CAROUSEL_LIMITS } from "@cover-craft/shared";
import { Input } from "@/components/ui";
import { useCarouselForm } from "@/hooks/useCarouselForm";
import {
	lato,
	montserrat,
	openSans,
	playfairDisplay,
	roboto,
} from "@/lib/utils";
import { CanvasSettingsCard } from "./CanvasSettingsCard";
import { CarouselFormControls } from "./CarouselFormControls";
import { CarouselPreviewDisplay } from "./CarouselPreviewDisplay";

export function CarouselForm() {
	const {
		deckSettings,
		slides,
		activeSlideIndex,
		activeSlide,
		contrastCheck,
		isGenerating,
		status,
		progress,
		total,
		slideResults,
		pdfUrl,
		error,
		isZipping,
		setActiveSlideIndex,
		updateDeckSettings,
		addSlide,
		removeSlide,
		moveSlide,
		updateSlide,
		handleGenerate,
		handleDownloadSlide,
		handleDownloadPDF,
		handleDownloadZip,
		handleRandomizeColors,
		handleReset,
	} = useCarouselForm();

	const hasEmptyTitle = slides.some((s) => !s.title?.trim());

	function getGenerateButtonLabel() {
		if (isGenerating) return "Generating your carousel deck";
		if (!contrastCheck.meetsWCAG)
			return `Generate button disabled: ${contrastCheck.message}`;
		return "Generate carousel PDF and slide PNG images";
	}

	return (
		<div
			className={`w-full flex flex-col gap-6 ${montserrat.variable} ${roboto.variable} ${lato.variable} ${playfairDisplay.variable} ${openSans.variable}`}
		>
			{/* Top: Full-width Canvas & Deck Settings */}
			<CanvasSettingsCard
				title="Canvas & Deck Settings"
				sizeId="deck-size"
				sizeValue={deckSettings.size}
				sizeOptions={["Square (1080 × 1080)", "Portrait (1080 × 1350)"]}
				onSizeChange={(size) => updateDeckSettings({ size })}
				sizeAriaLabel="Carousel dimensions format"
				fontId="deck-font"
				fontValue={deckSettings.font}
				onFontChange={(font) => updateDeckSettings({ font })}
				fontAriaLabel="Select font for all slides"
				filenameId="deck-filename"
				filenameValue={deckSettings.filename}
				filenamePlaceholder="my-awesome-carousel"
				filenameMaxLength={CAROUSEL_LIMITS.MAX_FILENAME_LENGTH}
				onFilenameChange={(filename) => updateDeckSettings({ filename })}
				filenameAriaLabel="Filename for generated carousel (optional)"
				backgroundColor={deckSettings.backgroundColor}
				textColor={deckSettings.textColor}
				onBackgroundColorChange={(color) =>
					updateDeckSettings({ backgroundColor: color })
				}
				onTextColorChange={(color) => updateDeckSettings({ textColor: color })}
				onRandomizeColors={handleRandomizeColors}
				contrastCheck={contrastCheck}
				colorIdPrefix="deck"
				colorTitleContext="carousel"
				borderStyle={deckSettings.borderStyle}
				borderLines={deckSettings.borderLines}
				onBorderStyleChange={(style) =>
					updateDeckSettings({ borderStyle: style })
				}
				onBorderLinesChange={(lines) =>
					updateDeckSettings({ borderLines: lines })
				}
				extraSettings={
					<div className="flex flex-col gap-4">
						<div className="flex flex-col sm:flex-row sm:items-center gap-3">
							<label
								htmlFor="deck-author"
								className="text-sm font-medium text-gray-900 shrink-0"
							>
								Author Handle:
							</label>
							<Input
								id="deck-author"
								placeholder="@username"
								value={deckSettings.authorHandle}
								onChange={(e) =>
									updateDeckSettings({ authorHandle: e.target.value })
								}
								maxLength={CAROUSEL_LIMITS.MAX_AUTHOR_HANDLE_LENGTH}
								aria-label="Author handle branding (optional)"
								className="flex-1"
							/>
						</div>

						<div className="flex flex-col sm:flex-row sm:items-center gap-3">
							<span className="text-sm font-medium text-gray-900 shrink-0">
								Slide Numbers:
							</span>
							<fieldset
								aria-label="Slide Numbers"
								className="inline-flex p-1 bg-gray-100 rounded-xl border border-gray-200 gap-1 flex-wrap m-0"
							>
								{(
									[
										{ value: "none", label: "None" },
										{ value: "bottom-right", label: "Bottom Right" },
										{ value: "top-right", label: "Top Right" },
										{ value: "top-left", label: "Top Left" },
									] as const
								).map((opt) => {
									const isActive =
										deckSettings.slideNumberPosition === opt.value;
									return (
										<button
											key={opt.value}
											type="button"
											onClick={() =>
												updateDeckSettings({
													slideNumberPosition: opt.value,
												})
											}
											aria-pressed={isActive}
											aria-label={opt.label}
											className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
												isActive
													? "bg-white text-emerald-700 shadow-xs font-bold"
													: "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
											}`}
										>
											{opt.label}
										</button>
									);
								})}
							</fieldset>
						</div>
					</div>
				}
				error={error}
				errorId="carousel-form-error"
				isGenerating={isGenerating}
				generateDisabled={hasEmptyTitle || !contrastCheck.meetsWCAG}
				generateButtonLabel="Generate Carousel"
				generateButtonTitle={
					!contrastCheck.meetsWCAG
						? `Cannot generate: ${contrastCheck.message}`
						: undefined
				}
				generateButtonAriaLabel={getGenerateButtonLabel()}
				onGenerate={handleGenerate}
				onReset={handleReset}
				resetAriaLabel="Reset entire carousel deck"
			/>

			{/* Bottom: Side-by-side Slides Manager and Live Preview */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
				<CarouselFormControls
					deckSettings={deckSettings}
					slides={slides}
					activeSlideIndex={activeSlideIndex}
					activeSlide={activeSlide}
					setActiveSlideIndex={setActiveSlideIndex}
					addSlide={addSlide}
					removeSlide={removeSlide}
					moveSlide={moveSlide}
					updateSlide={updateSlide}
				/>

				<CarouselPreviewDisplay
					deckSettings={deckSettings}
					slides={slides}
					activeSlideIndex={activeSlideIndex}
					setActiveSlideIndex={setActiveSlideIndex}
					isGenerating={isGenerating}
					status={status}
					progress={progress}
					total={total}
					pdfUrl={pdfUrl}
					slideResults={slideResults}
					isZipping={isZipping}
					handleDownloadSlide={handleDownloadSlide}
					handleDownloadPDF={handleDownloadPDF}
					handleDownloadZip={handleDownloadZip}
				/>
			</div>
		</div>
	);
}
