"use client";

import { CAROUSEL_LIMITS } from "@cover-craft/shared";
import {
	Button,
	Card,
	FormError,
	Input,
	SectionTitle,
	Select,
} from "@/components/ui";
import { useCarouselForm } from "@/hooks/useCarouselForm";
import {
	lato,
	montserrat,
	openSans,
	playfairDisplay,
	roboto,
} from "@/lib/utils";
import { CarouselFormControls } from "./CarouselFormControls";
import { CarouselPreviewDisplay } from "./CarouselPreviewDisplay";
import { FormField } from "./CoverFormControls";
import { FontSelect } from "./FontSelect";
import { SharedColorControls } from "./SharedColorControls";

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
			<Card className="w-full flex flex-col gap-6">
				<SectionTitle size="md">Canvas & Deck Settings</SectionTitle>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<FormField label="Size Preset" htmlFor="deck-size">
						<Select
							id="deck-size"
							value={deckSettings.size}
							onChange={(e) => updateDeckSettings({ size: e.target.value })}
							aria-label="Carousel dimensions format"
						>
							<option value="Square (1080 × 1080)">Square (1080 × 1080)</option>
							<option value="Portrait (1080 × 1350)">
								Portrait (1080 × 1350)
							</option>
						</Select>
					</FormField>

					<FontSelect
						id="deck-font"
						value={deckSettings.font}
						onChange={(font) => updateDeckSettings({ font })}
						ariaLabel="Select font for all slides"
					/>

					<FormField label="Filename" htmlFor="deck-filename">
						<Input
							id="deck-filename"
							placeholder="my-awesome-carousel"
							value={deckSettings.filename}
							onChange={(e) => updateDeckSettings({ filename: e.target.value })}
							maxLength={CAROUSEL_LIMITS.MAX_FILENAME_LENGTH}
							aria-label="Filename for generated carousel (optional)"
						/>
					</FormField>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
					{/* Left: Global Colors & Contrast */}
					<SharedColorControls
						idPrefix="deck"
						backgroundColor={deckSettings.backgroundColor}
						textColor={deckSettings.textColor}
						onBackgroundColorChange={(color) =>
							updateDeckSettings({ backgroundColor: color })
						}
						onTextColorChange={(color) =>
							updateDeckSettings({ textColor: color })
						}
						onRandomizeColors={handleRandomizeColors}
						contrastCheck={contrastCheck}
						titleContext="carousel"
					/>

					{/* Right: Border & Corner Overlays */}
					<div className="flex flex-col gap-4">
						<FormField label="Border Style" htmlFor="deck-border">
							<Select
								id="deck-border"
								value={deckSettings.borderStyle}
								onChange={(e) =>
									updateDeckSettings({
										borderStyle: e.target.value as "none" | "single" | "double",
									})
								}
								aria-label="Deck border style"
							>
								<option value="none">None</option>
								<option value="single">Single Line</option>
								<option value="double">Double Line</option>
							</Select>
						</FormField>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<FormField label="Author Handle" htmlFor="deck-author">
								<Input
									id="deck-author"
									placeholder="@username"
									value={deckSettings.authorHandle}
									onChange={(e) =>
										updateDeckSettings({ authorHandle: e.target.value })
									}
									maxLength={CAROUSEL_LIMITS.MAX_AUTHOR_HANDLE_LENGTH}
									aria-label="Author handle branding (optional)"
								/>
							</FormField>

							<FormField label="Slide Numbers" htmlFor="deck-number-pos">
								<Select
									id="deck-number-pos"
									value={deckSettings.slideNumberPosition}
									onChange={(e) =>
										updateDeckSettings({
											slideNumberPosition: e.target.value as
												| "none"
												| "top-right"
												| "bottom-right"
												| "top-left",
										})
									}
									aria-label="Slide number position"
								>
									<option value="none">None</option>
									<option value="top-right">Top Right</option>
									<option value="bottom-right">Bottom Right</option>
									<option value="top-left">Top Left</option>
								</Select>
							</FormField>
						</div>
					</div>
				</div>

				<FormError error={error} errorId="carousel-form-error" />

				<div className="flex justify-center gap-2">
					<Button
						onClick={handleGenerate}
						disabled={hasEmptyTitle || isGenerating || !contrastCheck.meetsWCAG}
						isLoading={isGenerating}
						title={
							!contrastCheck.meetsWCAG
								? `Cannot generate: ${contrastCheck.message}`
								: undefined
						}
						aria-label={getGenerateButtonLabel()}
					>
						{isGenerating ? "Generating..." : "Generate Carousel"}
					</Button>
					<Button
						variant="outline"
						onClick={handleReset}
						disabled={isGenerating}
						aria-label="Reset entire carousel deck"
					>
						Reset
					</Button>
				</div>
			</Card>

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
