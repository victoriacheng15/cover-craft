"use client";

import { MAX_SUBTITLE_LENGTH, MAX_TITLE_LENGTH } from "@cover-craft/shared";
import { Button, Card, Input, SectionTitle } from "@/components/ui";
import type { GifFormData, SlideItem } from "@/hooks";
import { FormField } from "./CoverFormControls";

export interface GifFormControlsProps {
	formData: GifFormData;
	addSlide: () => void;
	removeSlide: (index: number) => void;
	updateSlide: (index: number, updates: Partial<SlideItem>) => void;
}

export function GifFormControls({
	formData,
	addSlide,
	removeSlide,
	updateSlide,
}: GifFormControlsProps) {
	return (
		<Card className="flex-1 flex flex-col gap-6">
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

			<div className="flex flex-col gap-6">
				{formData.slides.map((slide, index) => (
					<div
						key={slide.id}
						className="border border-gray-200 rounded-xl p-4 bg-gray-50 flex flex-col gap-4"
					>
						<div className="flex justify-between items-center border-b border-gray-200 pb-2">
							<span className="font-bold text-sm text-gray-700">
								Slide {index + 1}
							</span>
							{formData.slides.length > 2 && (
								<Button
									type="button"
									variant="outline"
									className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
									onClick={() => removeSlide(index)}
									aria-label={`Remove slide ${index + 1}`}
								>
									Remove
								</Button>
							)}
						</div>

						<FormField label="Title" htmlFor={`slide-title-${index}`} required>
							<Input
								id={`slide-title-${index}`}
								placeholder="Slide title"
								value={slide.title}
								onChange={(e) => updateSlide(index, { title: e.target.value })}
								maxLength={MAX_TITLE_LENGTH}
								aria-label={`Enter title for slide ${index + 1}`}
							/>
							<div className="flex justify-end text-xs text-gray-500 mt-1">
								{slide.title.length} / {MAX_TITLE_LENGTH}
							</div>
						</FormField>

						<FormField label="Subtitle" htmlFor={`slide-subtitle-${index}`}>
							<Input
								id={`slide-subtitle-${index}`}
								placeholder="Slide subtitle (optional)"
								value={slide.subtitle}
								onChange={(e) =>
									updateSlide(index, { subtitle: e.target.value })
								}
								maxLength={MAX_SUBTITLE_LENGTH}
								aria-label={`Enter subtitle for slide ${index + 1}`}
							/>
							<div className="flex justify-end text-xs text-gray-500 mt-1">
								{slide.subtitle.length} / {MAX_SUBTITLE_LENGTH}
							</div>
						</FormField>
					</div>
				))}
			</div>
		</Card>
	);
}
