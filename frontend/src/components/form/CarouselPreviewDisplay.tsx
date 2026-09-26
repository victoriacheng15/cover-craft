"use client";

import { useEffect, useRef } from "react";
import { Button, Card, SectionTitle } from "@/components/ui";
import type {
	CarouselDeckSettings,
	CarouselSlideItem,
} from "@/hooks/useCarouselForm";

interface CarouselPreviewCanvasProps {
	deckSettings: CarouselDeckSettings;
	slide: CarouselSlideItem;
	slideIndex: number;
	totalSlides: number;
	className?: string;
}

export function CarouselPreviewCanvas({
	deckSettings,
	slide,
	slideIndex,
	totalSlides,
	className,
}: CarouselPreviewCanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const width = deckSettings.width;
		const height = deckSettings.height;
		const bgColor = slide.backgroundColor || deckSettings.backgroundColor;
		const textColor = slide.textColor || deckSettings.textColor;
		const font = deckSettings.font;

		// 1. Fill background
		ctx.clearRect(0, 0, width, height);
		ctx.fillStyle = bgColor;
		ctx.fillRect(0, 0, width, height);

		// 2. Draw border
		if (deckSettings.borderStyle === "single") {
			const inset = 18.0;
			ctx.strokeStyle = textColor;
			ctx.lineWidth = 4.0;
			ctx.strokeRect(inset, inset, width - 2 * inset, height - 2 * inset);
		} else if (deckSettings.borderStyle === "double") {
			const outerInset = 18.0;
			ctx.strokeStyle = textColor;
			ctx.lineWidth = 4.0;
			ctx.strokeRect(
				outerInset,
				outerInset,
				width - 2 * outerInset,
				height - 2 * outerInset,
			);

			const innerInset = 28.0;
			ctx.lineWidth = 4.0;
			ctx.strokeRect(
				innerInset,
				innerInset,
				width - 2 * innerInset,
				height - 2 * innerInset,
			);
		}

		// 3. Typography scale
		const headingFontSize = Math.round(Math.max(32.0, width * 0.052));
		const bodyFontSize = Math.round(Math.max(24.0, width * 0.034));
		const cornerFontSize = Math.round(Math.max(16.0, width * 0.022));
		const cornerMargin = 44.0;

		const getCornerCoords = (pos: string) => {
			switch (pos) {
				case "top-left":
					return {
						x: cornerMargin,
						y: cornerMargin,
						align: "left" as const,
						baseline: "top" as const,
					};
				case "top-right":
					return {
						x: width - cornerMargin,
						y: cornerMargin,
						align: "right" as const,
						baseline: "top" as const,
					};
				case "bottom-right":
					return {
						x: width - cornerMargin,
						y: height - cornerMargin,
						align: "right" as const,
						baseline: "bottom" as const,
					};
				default: // bottom-left
					return {
						x: cornerMargin,
						y: height - cornerMargin,
						align: "left" as const,
						baseline: "bottom" as const,
					};
			}
		};

		// 4. Corner branding: Author Handle
		if (deckSettings.authorHandle && deckSettings.authorHandle.trim() !== "") {
			ctx.font = `normal ${cornerFontSize}px "${font}", sans-serif`;
			ctx.fillStyle = textColor;
			const { x, y, align, baseline } = getCornerCoords(
				deckSettings.authorHandlePosition,
			);
			ctx.textAlign = align;
			ctx.textBaseline = baseline;
			ctx.fillText(deckSettings.authorHandle.trim(), x, y);
		}

		// 5. Corner pagination: Slide Number
		if (deckSettings.slideNumberPosition !== "none") {
			ctx.font = `normal ${cornerFontSize}px "${font}", sans-serif`;
			ctx.fillStyle = textColor;
			const { x, y, align, baseline } = getCornerCoords(
				deckSettings.slideNumberPosition,
			);
			ctx.textAlign = align;
			ctx.textBaseline = baseline;
			const slideNumStr = `${String(slideIndex + 1).padStart(2, "0")} / ${String(totalSlides).padStart(2, "0")}`;
			ctx.fillText(slideNumStr, x, y);
		}

		// 6. Content layout boundaries
		const contentMargin = 150.0;
		const topBound = 150.0;
		const bottomBound = height - 150.0;
		const boxHeight = bottomBound - topBound;
		const boxWidth = width - 2 * contentMargin;

		const wrapText = (text: string, maxWidth: number): string[] => {
			const words = text.split(" ");
			const lines: string[] = [];
			let currentLine = "";

			for (const word of words) {
				const testLine = currentLine ? `${currentLine} ${word}` : word;
				const measured = ctx.measureText(testLine).width;
				if (measured > maxWidth && currentLine) {
					lines.push(currentLine);
					currentLine = word;
				} else {
					currentLine = testLine;
				}
			}
			if (currentLine) {
				lines.push(currentLine);
			}
			return lines;
		};

		// 7. Measure title
		ctx.font = `bold ${headingFontSize}px "${font}", sans-serif`;
		const titleLines = wrapText(slide.title || "Your Title", boxWidth);
		const titleLineHeight = headingFontSize * 1.2;
		const titleHeight = titleLines.length * titleLineHeight;

		// 8. Measure body
		const hasListItems =
			slide.mode === "list" && slide.listItems && slide.listItems.length > 0;
		const hasSubtitle =
			slide.mode === "subtitle" &&
			slide.subtitle &&
			slide.subtitle.trim() !== "";

		const gap = headingFontSize * 1.25;
		const bodyLineHeight = bodyFontSize * 1.35;
		const itemSpacing = bodyFontSize * 0.55;

		ctx.font = `normal ${bodyFontSize}px "${font}", sans-serif`;
		let wrappedListItems: string[][] = [];
		let subtitleLines: string[] = [];
		let bodyHeight = 0;

		if (hasListItems) {
			wrappedListItems = slide.listItems.map((item) =>
				wrapText(`• ${item}`, boxWidth),
			);
			for (const lines of wrappedListItems) {
				bodyHeight += lines.length * bodyLineHeight;
			}
			if (slide.listItems.length > 1) {
				bodyHeight += (slide.listItems.length - 1) * itemSpacing;
			}
		} else if (hasSubtitle) {
			subtitleLines = wrapText(slide.subtitle, boxWidth);
			bodyHeight = subtitleLines.length * bodyLineHeight;
		}

		let totalContentHeight = titleHeight;
		if (hasListItems || hasSubtitle) {
			totalContentHeight += gap + bodyHeight;
		}

		// 9. Horizontal alignment
		let targetX = contentMargin;
		let canvasTextAlign: CanvasTextAlign = "left";
		if (slide.textAlign === "center") {
			targetX = width / 2;
			canvasTextAlign = "center";
		} else if (slide.textAlign === "right") {
			targetX = width - contentMargin;
			canvasTextAlign = "right";
		}

		// 10. Vertical alignment
		let startY = topBound;
		if (slide.verticalAlign === "center") {
			startY = topBound + (boxHeight - totalContentHeight) / 2.0;
		} else if (slide.verticalAlign === "bottom") {
			startY = bottomBound - totalContentHeight;
		}
		if (startY < topBound) {
			startY = topBound;
		}

		// 11. Draw title
		ctx.font = `bold ${headingFontSize}px "${font}", sans-serif`;
		ctx.fillStyle = textColor;
		ctx.textAlign = canvasTextAlign;
		ctx.textBaseline = "top";

		let currentY = startY;
		for (const line of titleLines) {
			ctx.fillText(line, targetX, currentY);
			currentY += titleLineHeight;
		}

		// 12. Draw body (List items or Subtitle)
		if (hasListItems) {
			ctx.font = `normal ${bodyFontSize}px "${font}", sans-serif`;
			ctx.fillStyle = textColor;
			currentY += gap;
			for (let i = 0; i < wrappedListItems.length; i++) {
				const lines = wrappedListItems[i];
				for (const line of lines) {
					ctx.fillText(line, targetX, currentY);
					currentY += bodyLineHeight;
				}
				if (i < wrappedListItems.length - 1) {
					currentY += itemSpacing;
				}
			}
		} else if (hasSubtitle) {
			ctx.font = `normal ${bodyFontSize}px "${font}", sans-serif`;
			ctx.fillStyle = textColor;
			currentY += gap;
			for (const line of subtitleLines) {
				ctx.fillText(line, targetX, currentY);
				currentY += bodyLineHeight;
			}
		}
	}, [deckSettings, slide, slideIndex, totalSlides]);

	return (
		<canvas
			ref={canvasRef}
			width={deckSettings.width}
			height={deckSettings.height}
			className={className}
			style={{
				maxWidth: "100%",
				height: "auto",
				display: "block",
				borderRadius: "inherit",
			}}
		/>
	);
}

export interface CarouselPreviewDisplayProps {
	deckSettings: CarouselDeckSettings;
	slides: CarouselSlideItem[];
	activeSlideIndex: number;
	setActiveSlideIndex: (index: number) => void;
	isGenerating: boolean;
	status: "idle" | "pending" | "processing" | "completed" | "failed";
	progress: number;
	total: number;
	pdfUrl: string | null;
	slideResults: string[];
	isZipping: boolean;
	handleDownloadSlide: (index: number) => void;
	handleDownloadPDF: () => void;
	handleDownloadZip: () => void;
}

export function CarouselPreviewDisplay({
	deckSettings,
	slides,
	activeSlideIndex,
	setActiveSlideIndex,
	isGenerating,
	status,
	progress,
	total,
	pdfUrl,
	slideResults,
	isZipping,
	handleDownloadSlide,
	handleDownloadPDF,
	handleDownloadZip,
}: CarouselPreviewDisplayProps) {
	const activeSlide = slides[activeSlideIndex] ?? slides[0];

	const handlePrev = () => {
		if (activeSlideIndex > 0) {
			setActiveSlideIndex(activeSlideIndex - 1);
		}
	};

	const handleNext = () => {
		if (activeSlideIndex < slides.length - 1) {
			setActiveSlideIndex(activeSlideIndex + 1);
		}
	};

	const hasResults = slideResults.length > 0 || pdfUrl !== null;

	return (
		<Card
			className="w-full flex flex-col items-center gap-6"
			aria-label="Live carousel preview and download controls"
		>
			{/* Generation Progress */}
			{isGenerating && (
				<div
					className="w-full p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col gap-2"
					role="status"
					aria-live="polite"
				>
					<div className="flex justify-between text-sm font-semibold text-emerald-800">
						<span>
							{status === "pending"
								? "Queuing generation..."
								: `Rendering slides (${progress}/${total})...`}
						</span>
						<span>{total > 0 ? Math.round((progress / total) * 100) : 0}%</span>
					</div>
					<div className="w-full bg-emerald-200 rounded-full h-2.5 overflow-hidden">
						<div
							className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
							style={{
								width: `${total > 0 ? (progress / total) * 100 : 0}%`,
							}}
						/>
					</div>
				</div>
			)}

			{/* Download Actions (Above Preview Section) */}
			{hasResults && (
				<div className="w-full flex flex-col gap-3 pb-6 border-b border-gray-200">
					<SectionTitle size="md">Generated Carousel Deck</SectionTitle>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
						{pdfUrl && (
							<Button
								type="button"
								variant="primary"
								onClick={handleDownloadPDF}
								aria-label="Download compiled PDF carousel"
							>
								Download PDF
							</Button>
						)}
						{slideResults[activeSlideIndex] && (
							<Button
								type="button"
								variant="outline"
								onClick={() => handleDownloadSlide(activeSlideIndex)}
								aria-label={`Download slide ${activeSlideIndex + 1} PNG`}
							>
								Slide {activeSlideIndex + 1} PNG
							</Button>
						)}
						{slideResults.length > 0 && (
							<Button
								type="button"
								variant="outline"
								onClick={handleDownloadZip}
								isLoading={isZipping}
								disabled={isZipping}
								aria-label="Download all slides and PDF as ZIP package"
							>
								All (ZIP)
							</Button>
						)}
					</div>
				</div>
			)}

			<div className="w-full flex justify-between items-center border-b border-gray-200 pb-3">
				<SectionTitle size="md">Slide Preview</SectionTitle>
				<span className="text-sm font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
					Slide {activeSlideIndex + 1} of {slides.length}
				</span>
			</div>

			{/* Canvas Container */}
			<div
				className="flex justify-center items-center rounded-xl border border-gray-300 max-w-full overflow-hidden"
				role="img"
				aria-label={`Preview of slide ${activeSlideIndex + 1}: ${activeSlide?.title || "Your Title"}`}
			>
				{activeSlide && (
					<CarouselPreviewCanvas
						deckSettings={deckSettings}
						slide={activeSlide}
						slideIndex={activeSlideIndex}
						totalSlides={slides.length}
						className="w-full h-auto max-w-[500px]"
					/>
				)}
			</div>

			{/* Stepper Controls */}
			<div className="flex items-center gap-4">
				<Button
					type="button"
					variant="secondary"
					onClick={handlePrev}
					disabled={activeSlideIndex === 0}
					aria-label="Previous slide preview"
				>
					◀ Previous
				</Button>

				<div className="flex gap-1.5">
					{slides.map((s, idx) => (
						<button
							key={s.id}
							type="button"
							onClick={() => setActiveSlideIndex(idx)}
							className={`w-3 h-3 rounded-full transition-all ${
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
					onClick={handleNext}
					disabled={activeSlideIndex === slides.length - 1}
					aria-label="Next slide preview"
				>
					Next ▶
				</Button>
			</div>
		</Card>
	);
}
