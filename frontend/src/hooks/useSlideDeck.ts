import { useCallback, useRef, useState } from "react";

export interface UseSlideDeckOptions<T extends { id: string }> {
	initialSlides: T[];
	createSlide: (index: number) => T;
	minSlides?: number;
	maxSlides?: number;
}

export interface UseSlideDeckReturn<T extends { id: string }> {
	slides: T[];
	setSlides: React.Dispatch<React.SetStateAction<T[]>>;
	activeSlideIndex: number;
	activeSlide: T;
	setActiveSlideIndex: (index: number | ((prev: number) => number)) => void;
	addSlide: () => void;
	removeSlide: (index: number) => void;
	moveSlide: (fromIndex: number, toIndex: number) => void;
	updateSlide: (index: number, partial: Partial<T>) => void;
	resetSlides: (newSlides?: T[]) => void;
}

export function useSlideDeck<T extends { id: string }>({
	initialSlides,
	createSlide,
	minSlides = 2,
	maxSlides = 10,
}: UseSlideDeckOptions<T>): UseSlideDeckReturn<T> {
	const [slides, setSlides] = useState<T[]>(initialSlides);
	const [activeSlideIndex, setActiveSlideIndex] = useState(0);

	const slidesLengthRef = useRef(slides.length);
	slidesLengthRef.current = slides.length;

	const activeSlide: T = (slides[activeSlideIndex] ??
		slides[0] ??
		initialSlides[0]) as T;

	const setActiveSlideIndexClamped = useCallback(
		(indexOrFn: number | ((prev: number) => number)) => {
			setActiveSlideIndex((prev) => {
				const target =
					typeof indexOrFn === "function" ? indexOrFn(prev) : indexOrFn;
				const length = slidesLengthRef.current;
				if (length === 0) return 0;
				return Math.max(0, Math.min(target, length - 1));
			});
		},
		[],
	);

	const addSlide = useCallback(() => {
		if (slidesLengthRef.current >= maxSlides) return;
		const newIndex = slidesLengthRef.current;
		const newSlide = createSlide(newIndex);
		slidesLengthRef.current += 1;
		setSlides((prev) => [...prev, newSlide]);
		setActiveSlideIndex(newIndex);
	}, [maxSlides, createSlide]);

	const removeSlide = useCallback(
		(index: number) => {
			if (slidesLengthRef.current <= minSlides) return;
			slidesLengthRef.current -= 1;
			setSlides((prev) => prev.filter((_, i) => i !== index));
			setActiveSlideIndex((prev) => {
				if (prev >= index && prev > 0) {
					return prev - 1;
				}
				return prev;
			});
		},
		[minSlides],
	);

	const moveSlide = useCallback((fromIndex: number, toIndex: number) => {
		const length = slidesLengthRef.current;
		if (
			fromIndex < 0 ||
			fromIndex >= length ||
			toIndex < 0 ||
			toIndex >= length ||
			fromIndex === toIndex
		) {
			return;
		}
		setSlides((prev) => {
			const next = [...prev];
			const [moved] = next.splice(fromIndex, 1);
			next.splice(toIndex, 0, moved);
			return next;
		});
		setActiveSlideIndex(toIndex);
	}, []);

	const updateSlide = useCallback((index: number, partial: Partial<T>) => {
		setSlides((prev) => {
			const next = [...prev];
			if (!next[index]) return prev;
			next[index] = { ...next[index], ...partial };
			return next;
		});
	}, []);

	const resetSlides = useCallback(
		(newSlides?: T[]) => {
			const targetSlides = newSlides ?? initialSlides;
			slidesLengthRef.current = targetSlides.length;
			setSlides(targetSlides);
			setActiveSlideIndex(0);
		},
		[initialSlides],
	);

	return {
		slides,
		setSlides,
		activeSlideIndex,
		activeSlide,
		setActiveSlideIndex: setActiveSlideIndexClamped,
		addSlide,
		removeSlide,
		moveSlide,
		updateSlide,
		resetSlides,
	};
}
