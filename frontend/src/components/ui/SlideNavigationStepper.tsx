"use client";

import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface SlideNavigationStepperProps {
	activeIndex: number;
	totalSlides: number;
	slideIds?: string[];
	onSelectIndex: (index: number) => void;
	onPrev?: () => void;
	onNext?: () => void;
	className?: string;
	prevAriaLabel?: string;
	nextAriaLabel?: string;
	size?: "sm" | "md";
}

export function SlideNavigationStepper({
	activeIndex,
	totalSlides,
	slideIds,
	onSelectIndex,
	onPrev,
	onNext,
	className,
	prevAriaLabel = "Previous slide",
	nextAriaLabel = "Next slide",
	size = "md",
}: SlideNavigationStepperProps) {
	const handlePrev = () => {
		if (onPrev) {
			onPrev();
		} else if (activeIndex > 0) {
			onSelectIndex(activeIndex - 1);
		}
	};

	const handleNext = () => {
		if (onNext) {
			onNext();
		} else if (activeIndex < totalSlides - 1) {
			onSelectIndex(activeIndex + 1);
		}
	};

	const isSmall = size === "sm";
	const keys =
		slideIds && slideIds.length === totalSlides
			? slideIds
			: Array.from({ length: totalSlides }, (_, i) => `slide-step-${i + 1}`);

	return (
		<div className={cn("flex items-center gap-4", className)}>
			<Button
				type="button"
				variant="secondary"
				className={isSmall ? "h-8 px-3 text-xs" : undefined}
				onClick={handlePrev}
				disabled={activeIndex <= 0}
				aria-label={prevAriaLabel}
			>
				◀ Previous
			</Button>

			<div className="flex gap-1.5">
				{keys.map((key, idx) => (
					<button
						key={key}
						type="button"
						onClick={() => onSelectIndex(idx)}
						className={cn(
							"rounded-full transition-all",
							isSmall ? "w-2.5 h-2.5" : "w-3 h-3",
							idx === activeIndex
								? "bg-emerald-600 scale-125"
								: "bg-gray-300 hover:bg-gray-400",
						)}
						aria-label={`Jump to slide ${idx + 1}`}
					/>
				))}
			</div>

			<Button
				type="button"
				variant="secondary"
				className={isSmall ? "h-8 px-3 text-xs" : undefined}
				onClick={handleNext}
				disabled={activeIndex >= totalSlides - 1}
				aria-label={nextAriaLabel}
			>
				Next ▶
			</Button>
		</div>
	);
}
