"use client";

import { MAX_SUBTITLE_LENGTH, MAX_TITLE_LENGTH } from "@cover-craft/shared";
import { Button, Card, Input, SectionTitle } from "@/components/ui";
import type { GifFormData, SlideItem } from "@/hooks";
import { FormField } from "./CoverFormControls";

export interface GifFormControlsProps {
	formData: GifFormData;
	activeSlideIndex: number;
	activeSlide: SlideItem;
	setActiveSlideIndex: (index: number) => void;
	addSlide: () => void;
	removeSlide: (index: number) => void;
	moveSlide: (fromIndex: number, toIndex: number) => void;
	updateSlide: (index: number, updates: Partial<SlideItem>) => void;
}

export function GifFormControls({
	formData,
	activeSlideIndex,
	activeSlide,
	setActiveSlideIndex,
	addSlide,
	removeSlide,
	moveSlide,
	updateSlide,
}: GifFormControlsProps) {
	const currentSlide =
		activeSlide ?? formData.slides[activeSlideIndex] ?? formData.slides[0];

	const handlePrev = () => {
		if (activeSlideIndex > 0) {
			setActiveSlideIndex(activeSlideIndex - 1);
		}
	};

	const handleNext = () => {
		if (activeSlideIndex < formData.slides.length - 1) {
			setActiveSlideIndex(activeSlideIndex + 1);
		}
	};

	return (
		<div className="flex-1 flex flex-col gap-6">
			<Card className="flex flex-col gap-4">
				<div className="flex justify-between items-center">
					<SectionTitle size="md">
						Slides ({formData.slides.length}/10)
					</SectionTitle>
					<Button
						type="button"
						variant="outline"
						onClick={addSlide}
						disabled={formData.slides.length >= 10}
						aria-label="Add a new slide to the slideshow"
					>
						+ Add Slide
					</Button>
				</div>

				{/* Filmstrip Tab Strip */}
				<div
					className="flex flex-wrap gap-2 pb-2 border-b border-gray-200"
					role="tablist"
					aria-label="Slideshow filmstrip"
				>
					{formData.slides.map((s, idx) => {
						const isSelected = idx === activeSlideIndex;
						return (
							<button
								key={s.id}
								type="button"
								role="tab"
								aria-selected={isSelected}
								onClick={() => setActiveSlideIndex(idx)}
								className={`px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
									isSelected
										? "bg-emerald-600 text-white shadow-xs"
										: "bg-gray-100 text-gray-700 hover:bg-gray-200"
								}`}
							>
								<span>Slide {idx + 1}</span>
							</button>
						);
					})}
				</div>

				{/* Active Slide Reordering & Delete Controls */}
				<div className="flex justify-between items-center">
					<div className="flex gap-2 items-center">
						<span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
							Reorder:
						</span>
						<Button
							type="button"
							variant="secondary"
							className="h-8 px-2.5 text-xs"
							onClick={() => moveSlide(activeSlideIndex, activeSlideIndex - 1)}
							disabled={activeSlideIndex === 0}
							aria-label={`Move slide ${activeSlideIndex + 1} left`}
						>
							◀ Left
						</Button>
						<Button
							type="button"
							variant="secondary"
							className="h-8 px-2.5 text-xs"
							onClick={() => moveSlide(activeSlideIndex, activeSlideIndex + 1)}
							disabled={activeSlideIndex === formData.slides.length - 1}
							aria-label={`Move slide ${activeSlideIndex + 1} right`}
						>
							Right ▶
						</Button>
					</div>

					<Button
						type="button"
						variant="outline"
						className="h-8 px-3 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
						onClick={() => removeSlide(activeSlideIndex)}
						disabled={formData.slides.length <= 2}
						aria-label={`Delete slide ${activeSlideIndex + 1}`}
					>
						Delete Slide
					</Button>
				</div>
			</Card>

			{/* Slide Content Editor */}
			<Card className="flex flex-col gap-4">
				<div className="flex justify-between items-center border-b border-gray-200 pb-2">
					<SectionTitle size="sm" as="h3">
						Slide {activeSlideIndex + 1} Content
					</SectionTitle>
				</div>

				{/* Title */}
				<FormField
					label="Slide Title"
					htmlFor={`slide-title-${activeSlideIndex}`}
					required
				>
					<Input
						id={`slide-title-${activeSlideIndex}`}
						placeholder="E.g., Welcome to Cover Craft"
						value={currentSlide?.title ?? ""}
						onChange={(e) =>
							updateSlide(activeSlideIndex, { title: e.target.value })
						}
						maxLength={MAX_TITLE_LENGTH}
						aria-label="Slide title"
					/>
					<div className="flex justify-end text-xs text-gray-500 mt-1">
						{currentSlide?.title?.length ?? 0} / {MAX_TITLE_LENGTH}
					</div>
				</FormField>

				{/* Subtitle Field */}
				<FormField
					label="Slide Subtitle"
					htmlFor={`slide-sub-${activeSlideIndex}`}
				>
					<Input
						id={`slide-sub-${activeSlideIndex}`}
						placeholder="E.g., Create engaging covers in seconds"
						value={currentSlide?.subtitle ?? ""}
						onChange={(e) =>
							updateSlide(activeSlideIndex, { subtitle: e.target.value })
						}
						maxLength={MAX_SUBTITLE_LENGTH}
						aria-label="Slide subtitle text"
					/>
					<div className="flex justify-end text-xs text-gray-500 mt-1">
						{currentSlide?.subtitle?.length ?? 0} / {MAX_SUBTITLE_LENGTH}
					</div>
				</FormField>

				{/* Stepper Navigation */}
				<div className="flex justify-between items-center pt-2 border-t border-gray-200">
					<Button
						type="button"
						variant="secondary"
						className="h-8 px-3 text-xs"
						onClick={handlePrev}
						disabled={activeSlideIndex === 0}
						aria-label="Previous slide"
					>
						◀ Previous
					</Button>

					<div className="flex gap-1.5">
						{formData.slides.map((s, idx) => (
							<button
								key={s.id}
								type="button"
								onClick={() => setActiveSlideIndex(idx)}
								className={`w-2.5 h-2.5 rounded-full transition-all ${
									idx === activeSlideIndex
										? "bg-emerald-600 scale-125"
										: "bg-gray-300 hover:bg-gray-400"
								}`}
								aria-label={`Jump to slide ${idx + 1}`}
							/>
						))}
					</div>

					<Button
						type="button"
						variant="secondary"
						className="h-8 px-3 text-xs"
						onClick={handleNext}
						disabled={activeSlideIndex === formData.slides.length - 1}
						aria-label="Next slide"
					>
						Next ▶
					</Button>
				</div>
			</Card>
		</div>
	);
}
