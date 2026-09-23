"use client";

import { CAROUSEL_LIMITS, FONT_OPTIONS } from "@cover-craft/shared";
import {
	Button,
	Card,
	ColorPicker,
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
import { ColorContrastMessage, FormField } from "./CoverFormControls";

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

					<FormField label="Font" htmlFor="deck-font">
						<Select
							id="deck-font"
							value={deckSettings.font}
							onChange={(e) =>
								updateDeckSettings({
									font: e.target.value as (typeof FONT_OPTIONS)[number],
								})
							}
							aria-label="Select font for all slides"
						>
							{FONT_OPTIONS.map((f) => (
								<option key={f} value={f}>
									{f}
								</option>
							))}
						</Select>
					</FormField>

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
					<div className="flex flex-col gap-4">
						<ColorContrastMessage contrastCheck={contrastCheck} />

						<div className="flex flex-col sm:flex-row gap-4 sm:items-end">
							<div className="flex-1">
								<FormField
									label="Background Color"
									htmlFor="deck-background-color"
								>
									<ColorPicker
										id="deck-background-color"
										value={deckSettings.backgroundColor}
										onChange={(e) =>
											updateDeckSettings({ backgroundColor: e.target.value })
										}
										title="Choose background color for your carousel"
										aria-label="Background color picker"
									/>
								</FormField>
							</div>

							<div className="flex-1">
								<FormField label="Text Color" htmlFor="deck-text-color">
									<ColorPicker
										id="deck-text-color"
										value={deckSettings.textColor}
										onChange={(e) =>
											updateDeckSettings({ textColor: e.target.value })
										}
										title="Choose text color for your carousel"
										aria-label="Text color picker"
									/>
								</FormField>
							</div>

							<Button
								variant="outline"
								onClick={handleRandomizeColors}
								aria-label="Randomize background and text colors"
								type="button"
								className="shrink-0"
							>
								Randomize Colors
							</Button>
						</div>
					</div>

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
