import {
	type AllowedFont,
	DEFAULT_GIF_DELAY,
	FONT_OPTIONS,
	type GifDelayPreset,
	getContrastRatio,
	MAX_SUBTITLE_LENGTH,
	MAX_TITLE_LENGTH,
	SIZE_PRESETS,
} from "@cover-craft/shared";
import { useState } from "react";
import { calculatePreviewDimensions, downloadImage } from "@/lib/utils";
import {
	generateGif,
	sendDownloadGifEvent,
	sendGenerateGifEvent,
} from "@/services/api";
import { useContrastCheck } from "./useContrastCheck";

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
	title: index === 0 ? "Welcome to Cover Craft" : `Key Highlight ${index + 1}`,
	subtitle: index === 0 ? "Create engaging covers in seconds" : "",
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

export function useGifForm() {
	const [formData, setFormData] = useState<GifFormData>(initialGifFormData);
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
		setFormData((prev) => ({ ...prev, size }));
	};

	const setBackgroundColor = (backgroundColor: string) => {
		setFormData((prev) => ({ ...prev, backgroundColor }));
	};

	const setTextColor = (textColor: string) => {
		setFormData((prev) => ({ ...prev, textColor }));
	};

	const setDelayMs = (delayMs: GifDelayPreset) => {
		setFormData((prev) => ({ ...prev, delayMs }));
	};

	const setFilename = (filename: string) => {
		setFormData((prev) => ({ ...prev, filename }));
	};

	const setFont = (font: AllowedFont) => {
		setFormData((prev) => ({ ...prev, font }));
	};

	const setHasBorder = (hasBorder: boolean) => {
		setFormData((prev) => ({ ...prev, hasBorder }));
	};

	const addSlide = () => {
		if (formData.slides.length >= 10) return;
		setFormData((prev) => ({
			...prev,
			slides: [...prev.slides, createDefaultSlide(prev.slides.length)],
		}));
	};

	const removeSlide = (index: number) => {
		if (formData.slides.length <= 2) return;
		setFormData((prev) => ({
			...prev,
			slides: prev.slides.filter((_, i) => i !== index),
		}));
	};

	const updateSlide = (index: number, updates: Partial<SlideItem>) => {
		setFormData((prev) => {
			const updated = [...prev.slides];
			updated[index] = { ...updated[index], ...updates };
			return { ...prev, slides: updated };
		});
	};

	const handleRandomizeColors = () => {
		const randomColor = () =>
			`#${Math.floor(Math.random() * 16777215)
				.toString(16)
				.padStart(6, "0")}`;

		// WCAG_AA_THRESHOLD = 4.5
		const RANDOMIZE_THRESHOLD = 6.0;

		let bgColor: string;
		let textColor: string;
		let ratio: number | null = null;

		do {
			bgColor = randomColor();
			textColor = randomColor();
			ratio = getContrastRatio(bgColor, textColor);
		} while (ratio === null || ratio < RANDOMIZE_THRESHOLD);

		setFormData((prev) => ({
			...prev,
			backgroundColor: bgColor,
			textColor: textColor,
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
			const timestamp = Math.floor(Date.now() / 1000);
			const filename = `${formData.filename || "slideshow"}-${timestamp}.gif`;
			await downloadImage(generatedGif, filename);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to download animated GIF",
			);
		}
	};

	const handleReset = () => {
		setFormData(initialGifFormData);
		setGeneratedGif(null);
		setGeneratedGifUrl(null);
		setError(null);
		setIsGenerating(false);
	};

	return {
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
		addSlide,
		removeSlide,
		updateSlide,
		handleRandomizeColors,
		getPreviewDimensions,
		handleGenerate,
		handleDownload,
		handleReset,
	};
}
