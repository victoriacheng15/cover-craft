import {
	DEFAULT_FILENAME,
	FONT_OPTIONS,
	MAX_SUBTITLE_LENGTH,
	MAX_TITLE_LENGTH,
	SIZE_PRESETS,
} from "@cover-craft/shared";
import { useState } from "react";
import { calculatePreviewDimensions, downloadImage } from "@/lib";
import {
	generateCoverImage,
	sendDownloadEvent,
	sendGenerateEvent,
} from "@/services";
import { useContrastCheck } from "./useContrastCheck";

export interface FormData {
	size: string;
	filename: string;
	title: string;
	subtitle?: string;
	backgroundColor: string;
	textColor: string;
	font: string;
}

const initialFormData: FormData = {
	size: SIZE_PRESETS[0].label,
	filename: "",
	title: "",
	subtitle: "",
	backgroundColor: "#374151",
	textColor: "#F9FAFB",
	font: FONT_OPTIONS[0],
};

export function useForm() {
	const [formData, setFormData] = useState<FormData>(initialFormData);
	const [isGenerating, setIsGenerating] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [generatedImage, setGeneratedImage] = useState<Blob | null>(null);
	const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
		null,
	);
	const [generatedFilename, setGeneratedFilename] =
		useState<string>(DEFAULT_FILENAME);

	const contrastCheck = useContrastCheck(
		formData.backgroundColor,
		formData.textColor,
	);

	const handleInputChange = (key: keyof FormData, value: string) => {
		setFormData((prev) => ({ ...prev, [key]: value }));
	};

	const getPreviewDimensions = () => {
		return calculatePreviewDimensions(formData.size);
	};

	const handleGenerate = async () => {
		try {
			setIsGenerating(true);
			setError(null);
			setGeneratedImageUrl(null);
			const selectedSize = SIZE_PRESETS.find(
				(preset) => preset.label === formData.size,
			);

			if (!selectedSize) throw new Error("Invalid size selected");

			// Client-side validation for title and subtitle length
			if (formData.title && formData.title.length > MAX_TITLE_LENGTH) {
				setError(`title must be ${MAX_TITLE_LENGTH} characters or less`);
				setIsGenerating(false);
				return;
			}

			if (formData.subtitle && formData.subtitle.length > MAX_SUBTITLE_LENGTH) {
				setError(`subtitle must be ${MAX_SUBTITLE_LENGTH} characters or less`);
				setIsGenerating(false);
				return;
			}

			const { blob, clientDuration } = await generateCoverImage({
				width: selectedSize.width,
				height: selectedSize.height,
				backgroundColor: formData.backgroundColor,
				textColor: formData.textColor,
				font: formData.font,
				title: formData.title,
				subtitle: formData.subtitle,
				filename: formData.filename || DEFAULT_FILENAME,
			});
			// Send minimal payload (intent + client performance)
			sendGenerateEvent({
				clientDuration,
				size: {
					width: selectedSize.width,
					height: selectedSize.height,
				},
			});

			setGeneratedImage(blob);
			setGeneratedFilename(formData.filename || DEFAULT_FILENAME);
			const reader = new FileReader();
			reader.onload = () => setGeneratedImageUrl(reader.result as string);
			reader.readAsDataURL(blob);
			setFormData(initialFormData);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to generate image");
		} finally {
			setIsGenerating(false);
		}
	};

	const handleDownload = async () => {
		if (!generatedImage) return;
		try {
			sendDownloadEvent();
			const timestamp = Math.floor(Date.now() / 1000);
			const downloadFilename = `${generatedFilename}-${timestamp}.png`;
			await downloadImage(generatedImage, downloadFilename);
			handleReset();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to download image");
		}
	};

	const handleReset = () => {
		setFormData(initialFormData);
		setGeneratedImage(null);
		setGeneratedImageUrl(null);
		setGeneratedFilename(DEFAULT_FILENAME);
		setError(null);
		setIsGenerating(false);
	};

	return {
		formData,
		isGenerating,
		error,
		generatedImageUrl,
		handleInputChange,
		getPreviewDimensions,
		handleGenerate,
		handleDownload,
		handleReset,
		contrastCheck,
	};
}
