"use client";

import Image from "next/image";
import { Button, Card, SectionTitle } from "@/components/ui";
import type { GifFormData } from "@/hooks";
import { PreviewCanvas } from "./CoverPreviewDisplay";

interface GifPreviewDisplayProps {
	formData: GifFormData;
	generatedGifUrl: string | null;
	getPreviewDimensions: () => { width: number; height: number };
	handleDownload: () => void;
}

export function GifPreviewDisplay({
	formData,
	generatedGifUrl,
	getPreviewDimensions,
	handleDownload,
}: GifPreviewDisplayProps) {
	const { width, height } = getPreviewDimensions();

	return (
		<Card className="flex-1 flex flex-col gap-6 items-center h-fit">
			{generatedGifUrl && (
				<div className="w-full flex flex-col gap-3 items-center pb-6 border-b border-gray-200">
					<SectionTitle size="md">Generated Animated GIF</SectionTitle>
					<div className="w-full flex justify-center items-center">
						<Image
							src={generatedGifUrl}
							alt={`Generated GIF slideshow with ${formData.slides.length} slides`}
							width={width}
							height={height}
							className="max-w-full h-auto object-contain rounded-xl border border-gray-300 shadow-sm"
							unoptimized
						/>
					</div>
					<Button
						onClick={handleDownload}
						aria-label={`Download generated animated GIF as ${formData.filename || "slideshow"}.gif`}
					>
						Download GIF
					</Button>
				</div>
			)}

			<div className="w-full flex flex-col gap-6">
				<div className="flex justify-between items-center border-b border-gray-200 pb-2">
					<SectionTitle size="md">Live Slides Preview</SectionTitle>
					<span className="text-xs text-gray-500 font-medium">
						{formData.slides.length} slides ({formData.delayMs}ms delay)
					</span>
				</div>

				<div className="flex flex-col gap-8 w-full">
					{formData.slides.map((slide, index) => (
						<div key={slide.id} className="flex flex-col gap-2 w-full">
							<div className="flex justify-between items-center px-1">
								<span className="text-sm font-bold text-gray-700">
									Slide {index + 1}
								</span>
								<span className="text-xs text-gray-500 truncate max-w-[200px]">
									{slide.title || "Untitled Slide"}
								</span>
							</div>
							<div className="w-full flex justify-center items-center">
								<PreviewCanvas
									params={{
										title: slide.title || `Slide ${index + 1}`,
										subtitle: slide.subtitle || undefined,
										font: formData.font,
										backgroundColor: formData.backgroundColor,
										textColor: formData.textColor,
										width,
										height,
										filename: formData.filename || "slideshow",
										hasBorder: formData.hasBorder,
									}}
									className="w-full h-auto"
								/>
							</div>
						</div>
					))}
				</div>
			</div>
		</Card>
	);
}
