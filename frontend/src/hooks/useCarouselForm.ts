import {
	type AllowedFont,
	CAROUSEL_LIMITS,
	type CarouselParams,
	type CarouselSlideParams,
	getContrastRatio,
	isValidHexColor,
	SIZE_PRESETS,
} from "@cover-craft/shared";
import JSZip from "jszip";
import { useCallback, useRef, useState } from "react";
import { generateCarousel, getCarouselJobStatus } from "@/services/api";
import { useContrastCheck } from "./useContrastCheck";

export interface CarouselSlideItem {
	id: string;
	title: string;
	mode: "subtitle" | "list";
	subtitle: string;
	listItems: string[];
	textAlign: "left" | "center" | "right";
	verticalAlign: "top" | "center" | "bottom";
	textColor?: string;
	backgroundColor?: string;
}

export interface CarouselDeckSettings {
	size: string;
	width: number;
	height: number;
	backgroundColor: string;
	textColor: string;
	font: AllowedFont;
	borderStyle: "none" | "single" | "double";
	authorHandle: string;
	authorHandlePosition: "bottom-left" | "bottom-right" | "top-left";
	slideNumberPosition: "none" | "top-right" | "bottom-right" | "top-left";
	filename: string;
}

export const createDefaultSlide = (index: number): CarouselSlideItem => {
	if (index === 0) {
		return {
			id: `slide-${Date.now()}-${index}`,
			title: "",
			mode: "subtitle",
			subtitle: "",
			listItems: ["", ""],
			textAlign: "left",
			verticalAlign: "top",
		};
	}
	return {
		id: `slide-${Date.now()}-${index}`,
		title: "",
		mode: "subtitle",
		subtitle: "",
		listItems: ["", ""],
		textAlign: "left",
		verticalAlign: "top",
	};
};

export const initialDeckSettings: CarouselDeckSettings = {
	size: "Square (1080 × 1080)",
	width: 1080,
	height: 1080,
	backgroundColor: "#374151",
	textColor: "#F9FAFB",
	font: "Montserrat",
	borderStyle: "none",
	authorHandle: "",
	authorHandlePosition: "bottom-left",
	slideNumberPosition: "none",
	filename: "",
};

export const initialSlides: CarouselSlideItem[] = [
	createDefaultSlide(0),
	createDefaultSlide(1),
];

export function useCarouselForm() {
	const [deckSettings, setDeckSettings] =
		useState<CarouselDeckSettings>(initialDeckSettings);
	const [slides, setSlides] = useState<CarouselSlideItem[]>(initialSlides);
	const [activeSlideIndex, setActiveSlideIndex] = useState(0);

	const [isGenerating, setIsGenerating] = useState(false);
	const [status, setStatus] = useState<
		"idle" | "pending" | "processing" | "completed" | "failed"
	>("idle");
	const [progress, setProgress] = useState(0);
	const [total, setTotal] = useState(slides.length);
	const [jobId, setJobId] = useState<string | null>(null);
	const [slideResults, setSlideResults] = useState<string[]>([]);
	const [pdfUrl, setPdfUrl] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isZipping, setIsZipping] = useState(false);

	const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

	// Contrast check for deck-level colors or active slide overrides
	const activeSlide = slides[activeSlideIndex] ?? slides[0];
	const effectiveBg =
		activeSlide?.backgroundColor || deckSettings.backgroundColor;
	const effectiveText = activeSlide?.textColor || deckSettings.textColor;
	const contrastCheck = useContrastCheck(effectiveBg, effectiveText);

	// Update deck settings
	const updateDeckSettings = useCallback(
		(partial: Partial<CarouselDeckSettings>) => {
			setDeckSettings((prev) => {
				const next = { ...prev, ...partial };
				if (partial.size && partial.size !== prev.size) {
					const preset = SIZE_PRESETS.find((p) => p.label === partial.size);
					if (preset) {
						next.width = preset.width;
						next.height = preset.height;
					}
				}
				return next;
			});
		},
		[],
	);

	// Add slide (up to max 10)
	const addSlide = useCallback(() => {
		if (slides.length >= CAROUSEL_LIMITS.MAX_SLIDES) return;
		const newIndex = slides.length;
		const newSlide = createDefaultSlide(newIndex);
		setSlides((prev) => [...prev, newSlide]);
		setActiveSlideIndex(newIndex);
	}, [slides.length]);

	// Remove slide (down to min 2)
	const removeSlide = useCallback(
		(index: number) => {
			if (slides.length <= CAROUSEL_LIMITS.MIN_SLIDES) return;
			setSlides((prev) => prev.filter((_, i) => i !== index));
			setActiveSlideIndex((prev) => {
				if (prev >= index && prev > 0) {
					return prev - 1;
				}
				return prev;
			});
		},
		[slides.length],
	);

	// Move slide in filmstrip
	const moveSlide = useCallback(
		(fromIndex: number, toIndex: number) => {
			if (toIndex < 0 || toIndex >= slides.length || fromIndex === toIndex)
				return;
			setSlides((prev) => {
				const next = [...prev];
				const [moved] = next.splice(fromIndex, 1);
				next.splice(toIndex, 0, moved);
				return next;
			});
			setActiveSlideIndex(toIndex);
		},
		[slides.length],
	);

	// Update specific slide
	const updateSlide = useCallback(
		(index: number, partial: Partial<CarouselSlideItem>) => {
			setSlides((prev) => {
				const next = [...prev];
				if (!next[index]) return prev;
				next[index] = { ...next[index], ...partial };
				return next;
			});
		},
		[],
	);

	// Stop polling
	const stopPolling = useCallback(() => {
		if (pollingTimerRef.current) {
			clearInterval(pollingTimerRef.current);
			pollingTimerRef.current = null;
		}
	}, []);

	// Poll job status
	const pollStatus = useCallback(
		async (id: string) => {
			try {
				const res = await getCarouselJobStatus(id);
				setStatus(res.status);
				setProgress(res.progress);
				setTotal(res.total);
				if (res.results) {
					setSlideResults(res.results);
				}
				if (res.pdfUrl) {
					setPdfUrl(res.pdfUrl);
				}

				if (res.status === "completed") {
					setIsGenerating(false);
					stopPolling();
				} else if (res.status === "failed") {
					setIsGenerating(false);
					setError(res.error ?? "Carousel generation failed");
					stopPolling();
				}
			} catch (err) {
				setIsGenerating(false);
				setError(
					err instanceof Error ? err.message : "Failed to poll job status",
				);
				stopPolling();
			}
		},
		[stopPolling],
	);

	// Validate client-side before submit
	const validateForm = useCallback((): string | null => {
		if (slides.length < CAROUSEL_LIMITS.MIN_SLIDES) {
			return `Carousel deck must contain at least ${CAROUSEL_LIMITS.MIN_SLIDES} slides.`;
		}
		if (slides.length > CAROUSEL_LIMITS.MAX_SLIDES) {
			return `Carousel deck cannot exceed ${CAROUSEL_LIMITS.MAX_SLIDES} slides.`;
		}

		// Contrast validation for deck colors
		if (
			!isValidHexColor(deckSettings.backgroundColor) ||
			!isValidHexColor(deckSettings.textColor)
		) {
			return "Invalid hex color format.";
		}
		const deckContrast = getContrastRatio(
			deckSettings.backgroundColor,
			deckSettings.textColor,
		);
		if (deckContrast === null || deckContrast < 4.5) {
			return `Global color contrast ratio (${(deckContrast ?? 0).toFixed(2)}:1) is below WCAG AA 4.5:1 requirement.`;
		}

		// Validate each slide
		for (let i = 0; i < slides.length; i++) {
			const s = slides[i];
			if (!s.title || s.title.trim() === "") {
				return `Slide ${i + 1} title cannot be empty.`;
			}
			if (s.title.length > CAROUSEL_LIMITS.MAX_TITLE_LENGTH) {
				return `Slide ${i + 1} title exceeds maximum ${CAROUSEL_LIMITS.MAX_TITLE_LENGTH} characters.`;
			}

			if (s.mode === "subtitle" && s.subtitle) {
				if (s.subtitle.length > CAROUSEL_LIMITS.MAX_SUBTITLE_LENGTH) {
					return `Slide ${i + 1} subtitle exceeds maximum ${CAROUSEL_LIMITS.MAX_SUBTITLE_LENGTH} characters.`;
				}
			}

			if (s.mode === "list") {
				if (
					s.listItems.length < CAROUSEL_LIMITS.MIN_LIST_ITEMS ||
					s.listItems.length > CAROUSEL_LIMITS.MAX_LIST_ITEMS
				) {
					return `Slide ${i + 1} bulleted list must have between ${CAROUSEL_LIMITS.MIN_LIST_ITEMS} and ${CAROUSEL_LIMITS.MAX_LIST_ITEMS} items.`;
				}
				for (let j = 0; j < s.listItems.length; j++) {
					const item = s.listItems[j];
					if (!item || item.trim() === "") {
						return `Slide ${i + 1} list item ${j + 1} cannot be empty.`;
					}
					if (item.length > CAROUSEL_LIMITS.MAX_LIST_ITEM_LENGTH) {
						return `Slide ${i + 1} list item ${j + 1} exceeds maximum ${CAROUSEL_LIMITS.MAX_LIST_ITEM_LENGTH} characters.`;
					}
				}
			}

			// Validate color overrides if present
			if (s.backgroundColor || s.textColor) {
				const bg = s.backgroundColor || deckSettings.backgroundColor;
				const tx = s.textColor || deckSettings.textColor;
				const slideRatio = getContrastRatio(bg, tx);
				if (slideRatio === null || slideRatio < 4.5) {
					return `Slide ${i + 1} color override contrast ratio (${(slideRatio ?? 0).toFixed(2)}:1) is below WCAG AA 4.5:1 requirement.`;
				}
			}
		}

		return null;
	}, [deckSettings, slides]);

	// Submit carousel generation
	const handleGenerate = useCallback(async () => {
		setError(null);
		const validationError = validateForm();
		if (validationError) {
			setError(validationError);
			return;
		}

		setIsGenerating(true);
		setStatus("pending");
		setProgress(0);
		setTotal(slides.length);
		setSlideResults([]);
		setPdfUrl(null);
		stopPolling();

		const payloadSlides: CarouselSlideParams[] = slides.map((s) => {
			const slideParam: CarouselSlideParams = {
				title: s.title.trim(),
				textAlign: s.textAlign,
				verticalAlign: s.verticalAlign,
			};
			if (s.mode === "subtitle" && s.subtitle && s.subtitle.trim() !== "") {
				slideParam.subtitle = s.subtitle.trim();
			} else if (s.mode === "list" && s.listItems.length > 0) {
				slideParam.listItems = s.listItems.map((item) => item.trim());
			}
			if (s.textColor && isValidHexColor(s.textColor)) {
				slideParam.textColor = s.textColor;
			}
			if (s.backgroundColor && isValidHexColor(s.backgroundColor)) {
				slideParam.backgroundColor = s.backgroundColor;
			}
			return slideParam;
		});

		const payload: CarouselParams = {
			width: deckSettings.width,
			height: deckSettings.height,
			backgroundColor: deckSettings.backgroundColor,
			textColor: deckSettings.textColor,
			font: deckSettings.font,
			borderStyle: deckSettings.borderStyle,
			authorHandlePosition: deckSettings.authorHandlePosition,
			showSlideNumbers: deckSettings.slideNumberPosition !== "none",
			slideNumberPosition:
				deckSettings.slideNumberPosition !== "none"
					? deckSettings.slideNumberPosition
					: "top-right",
			slides: payloadSlides,
		};

		if (deckSettings.authorHandle && deckSettings.authorHandle.trim() !== "") {
			payload.authorHandle = deckSettings.authorHandle.trim();
		}

		if (deckSettings.filename && deckSettings.filename.trim() !== "") {
			payload.filename = deckSettings.filename.trim();
		}

		try {
			const res = await generateCarousel(payload);
			const newJobId = res.jobId || res.id;
			setJobId(newJobId);
			setStatus("processing");

			// Start polling loop
			pollingTimerRef.current = setInterval(() => {
				pollStatus(newJobId);
			}, 1000);
			// Immediate first poll
			pollStatus(newJobId);
		} catch (err) {
			setIsGenerating(false);
			setStatus("failed");
			setError(
				err instanceof Error ? err.message : "Failed to submit carousel job",
			);
		}
	}, [deckSettings, slides, validateForm, pollStatus, stopPolling]);

	// Download single slide PNG
	const handleDownloadSlide = useCallback(
		(index: number) => {
			const dataUrl = slideResults[index];
			if (!dataUrl) return;
			const timestamp = Math.floor(Date.now() / 1000);
			const base = deckSettings.filename || "carousel";
			const link = document.createElement("a");
			link.href = dataUrl;
			link.download = `${base}-slide-${index + 1}-${timestamp}.png`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		},
		[slideResults, deckSettings.filename],
	);

	// Download compiled PDF
	const handleDownloadPDF = useCallback(() => {
		if (!pdfUrl) return;
		const timestamp = Math.floor(Date.now() / 1000);
		const base = deckSettings.filename || "carousel";
		const link = document.createElement("a");
		link.href = pdfUrl;
		link.download = `${base}-${timestamp}.pdf`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}, [pdfUrl, deckSettings.filename]);

	// Download ZIP containing all slides and PDF
	const handleDownloadZip = useCallback(async () => {
		if (slideResults.length === 0 && !pdfUrl) return;

		try {
			setIsZipping(true);
			const zip = new JSZip();

			slideResults.forEach((result, idx) => {
				if (result.startsWith("data:image/png;base64,")) {
					const b64 = result.replace("data:image/png;base64,", "");
					zip.file(`slide-${idx + 1}.png`, b64, { base64: true });
				}
			});

			if (pdfUrl?.startsWith("data:application/pdf;base64,")) {
				const b64 = pdfUrl.replace("data:application/pdf;base64,", "");
				zip.file(`${deckSettings.filename || "carousel"}.pdf`, b64, {
					base64: true,
				});
			}

			const timestamp = Math.floor(Date.now() / 1000);
			const base = deckSettings.filename || "carousel";
			const content = await zip.generateAsync({ type: "blob" });
			const url = URL.createObjectURL(content);
			const link = document.createElement("a");
			link.href = url;
			link.download = `${base}-deck-${timestamp}.zip`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		} catch (_err) {
			setError("Failed to create ZIP package");
		} finally {
			setIsZipping(false);
		}
	}, [slideResults, pdfUrl, deckSettings.filename]);

	// Randomize colors with WCAG AA compliance
	const handleRandomizeColors = useCallback(() => {
		const randomColor = () =>
			`#${Math.floor(Math.random() * 16777215)
				.toString(16)
				.padStart(6, "0")}`;

		const RANDOMIZE_THRESHOLD = 6.0;

		let bgColor: string;
		let textColor: string;
		let ratio: number | null = null;

		do {
			bgColor = randomColor();
			textColor = randomColor();
			ratio = getContrastRatio(bgColor, textColor);
		} while (ratio === null || ratio < RANDOMIZE_THRESHOLD);

		setDeckSettings((prev) => ({
			...prev,
			backgroundColor: bgColor,
			textColor: textColor,
		}));
	}, []);

	// Reset form
	const handleReset = useCallback(() => {
		stopPolling();
		setDeckSettings(initialDeckSettings);
		setSlides(initialSlides);
		setActiveSlideIndex(0);
		setIsGenerating(false);
		setStatus("idle");
		setProgress(0);
		setTotal(initialSlides.length);
		setJobId(null);
		setSlideResults([]);
		setPdfUrl(null);
		setError(null);
	}, [stopPolling]);

	return {
		deckSettings,
		slides,
		activeSlideIndex,
		activeSlide,
		effectiveBg,
		effectiveText,
		contrastCheck,
		isGenerating,
		status,
		progress,
		total,
		jobId,
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
	};
}
