import {
	type AllowedFont,
	DEFAULT_GIF_DELAY,
	FONT_OPTIONS,
	type GifDelayPreset,
	MAX_SUBTITLE_LENGTH,
	MAX_TITLE_LENGTH,
	SIZE_PRESETS,
} from "@cover-craft/shared";
import { useState } from "react";
import {
	calculatePreviewDimensions,
	downloadImage,
	getRandomCompliantColorPair,
	getTimestampedFilename,
} from "@/lib/utils";
import {
	generateGif,
	sendDownloadGifEvent,
	sendGenerateGifEvent,
} from "@/services/api";
import { useContrastCheck } from "./useContrastCheck";
import { useSlideDeck } from "./useSlideDeck";

export interface SlideItem {
	id: string;
	title: string;
	subtitle: string;
}

export interface GifFormData {
	size: string;
	filename: string;
	backgroundColor: string;
	textColor: string;
	delayMs: GifDelayPreset;
	font: AllowedFont;
	hasBorder: boolean;
	slides: SlideItem[];
}

export const createDefaultSlide = (index: number): SlideItem => ({
	id: `slide-${Date.now()}-${index}`,
	title: "",
	subtitle: "",
});

export const initialGifFormData: GifFormData = {
	size: SIZE_PRESETS[0].label,
	filename: "",
	backgroundColor: "#374151",
	textColor: "#F9FAFB",
	delayMs: DEFAULT_GIF_DELAY,
	font: FONT_OPTIONS[0],
	hasBorder: false,
	slides: [createDefaultSlide(0), createDefaultSlide(1)],
};

const initialGifSettings = {
	size: initialGifFormData.size,
	filename: initialGifFormData.filename,
	backgroundColor: initialGifFormData.backgroundColor,
	textColor: initialGifFormData.textColor,
	delayMs: initialGifFormData.delayMs,
	font: initialGifFormData.font,
	hasBorder: initialGifFormData.hasBorder,
};

export function useGifForm() {
	const [settings, setSettings] = useState(initialGifSettings);
	const {
		slides,
		activeSlideIndex,
		activeSlide,
		setActiveSlideIndex,
		addSlide,
		removeSlide,
		moveSlide,
		updateSlide,
		resetSlides,
	} = useSlideDeck<SlideItem>({
		initialSlides: initialGifFormData.slides,
		createSlide: createDefaultSlide,
		minSlides: 2,
		maxSlides: 10,
	});

	const formData: GifFormData = {
		...settings,
		slides,
	};

	const [isGenerating, setIsGenerating] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [generatedGif, setGeneratedGif] = useState<Blob | null>(null);
	const [generatedGifUrl, setGeneratedGifUrl] = useState<string | null>(null);

	const contrastCheck = useContrastCheck(
		formData.backgroundColor,
		formData.textColor,
	);

	const getPreviewDimensions = () => {
		return calculatePreviewDimensions(formData.size);
	};

	const setSize = (size: string) => {
		setSettings((prev) => ({ ...prev, size }));
	};

	const setBackgroundColor = (backgroundColor: string) => {
		setSettings((prev) => ({ ...prev, backgroundColor }));
	};

	const setTextColor = (textColor: string) => {
		setSettings((prev) => ({ ...prev, textColor }));
	};

	const setDelayMs = (delayMs: GifDelayPreset) => {
		setSettings((prev) => ({ ...prev, delayMs }));
	};

	const setFilename = (filename: string) => {
		setSettings((prev) => ({ ...prev, filename }));
	};

	const setFont = (font: AllowedFont) => {
		setSettings((prev) => ({ ...prev, font }));
	};

	const setHasBorder = (hasBorder: boolean) => {
		setSettings((prev) => ({ ...prev, hasBorder }));
	};

	const handleRandomizeColors = () => {
		const { backgroundColor, textColor } = getRandomCompliantColorPair();
		setSettings((prev) => ({
			...prev,
			backgroundColor,
			textColor,
		}));
	};

	const handleGenerate = async () => {
		try {
			setIsGenerating(true);
			setError(null);
			setGeneratedGifUrl(null);

			if (formData.slides.length < 2) {
				throw new Error("GIF slideshow must contain at least 2 slides");
			}

			if (!contrastCheck.meetsWCAG) {
				throw new Error(`Cannot generate: ${contrastCheck.message}`);
			}

			const selectedSize = SIZE_PRESETS.find(
				(preset) => preset.label === formData.size,
			);
			if (!selectedSize) throw new Error("Invalid size selected");

			for (let i = 0; i < formData.slides.length; i++) {
				const slide = formData.slides[i];
				if (!slide.title || slide.title.trim() === "") {
					throw new Error(`Slide ${i + 1} requires a title`);
				}
				if (slide.title.length > MAX_TITLE_LENGTH) {
					throw new Error(
						`Slide ${i + 1} title must be ${MAX_TITLE_LENGTH} characters or less`,
					);
				}
				if (slide.subtitle && slide.subtitle.length > MAX_SUBTITLE_LENGTH) {
					throw new Error(
						`Slide ${i + 1} subtitle must be ${MAX_SUBTITLE_LENGTH} characters or less`,
					);
				}
			}

			const { blob, clientDuration } = await generateGif({
				width: selectedSize.width,
				height: selectedSize.height,
				backgroundColor: formData.backgroundColor,
				delayMs: formData.delayMs,
				filename: formData.filename || "slideshow",
				slides: formData.slides.map((s) => ({
					title: s.title,
					subtitle: s.subtitle || undefined,
					font: formData.font,
					textColor: formData.textColor,
					hasBorder: formData.hasBorder,
				})),
			});

			sendGenerateGifEvent({
				clientDuration,
				size: {
					width: selectedSize.width,
					height: selectedSize.height,
				},
				hasBorder: formData.hasBorder,
				slideCount: formData.slides.length,
			});

			setGeneratedGif(blob);
			const reader = new FileReader();
			reader.onload = () => setGeneratedGifUrl(reader.result as string);
			reader.readAsDataURL(blob);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to generate animated GIF",
			);
		} finally {
			setIsGenerating(false);
		}
	};

	const handleDownload = async () => {
		if (!generatedGif) return;
		try {
			sendDownloadGifEvent();
			const filename = getTimestampedFilename(
				formData.filename,
				"gif",
				"slideshow",
			);
			await downloadImage(generatedGif, filename);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to download animated GIF",
			);
		}
	};

	const handleReset = () => {
		setSettings(initialGifSettings);
		resetSlides();
		setGeneratedGif(null);
		setGeneratedGifUrl(null);
		setError(null);
		setIsGenerating(false);
	};

	return {
		formData,
		activeSlideIndex,
		activeSlide,
		setActiveSlideIndex,
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
		addSlide,
		removeSlide,
		moveSlide,
		updateSlide,
		handleRandomizeColors,
		getPreviewDimensions,
		handleGenerate,
		handleDownload,
		handleReset,
	};
}
