"use client";

import Image from "next/image";
import { Button, Card, SectionTitle } from "@/components/ui";
import type { FormData } from "@/hooks";
import { PreviewCanvas } from "./PreviewCanvas";

interface CoverPreviewDisplayProps {
	formData: FormData;
	generatedImageUrl: string | null;
	getPreviewDimensions: () => { width: number; height: number };
	handleDownload: () => void;
}

export default function CoverPreviewDisplay({
	formData,
	generatedImageUrl,
	getPreviewDimensions,
	handleDownload,
}: CoverPreviewDisplayProps) {
	const { width, height } = getPreviewDimensions();

	return (
		<Card
			className="w-full md:min-w-[300px] flex flex-col items-center"
			aria-label={
				generatedImageUrl
					? "Generated cover image"
					: "Live preview of cover image"
			}
			aria-live="polite"
		>
			{!generatedImageUrl ? (
				<>
					<SectionTitle size="lg">Live Preview</SectionTitle>
					<div
						className="flex justify-center items-center rounded-xl border border-gray-300 max-w-full overflow-hidden"
						role="img"
						aria-label={`Preview: ${formData.title || "Title"} - ${formData.subtitle || "Subtitle"}`}
					>
						<PreviewCanvas
							params={{
								title: formData.title,
								subtitle: formData.subtitle,
								font: formData.font,
								backgroundColor: formData.backgroundColor,
								textColor: formData.textColor,
								width,
								height,
								filename: formData.filename,
							}}
							className="w-full h-auto"
						/>
					</div>
				</>
			) : (
				<>
					<SectionTitle size="lg">Generated Image</SectionTitle>
					<div className="w-full flex justify-center items-center">
						<Image
							src={generatedImageUrl || ""}
							alt={`Generated cover image: ${formData.title}`}
							width={width}
							height={height}
							className="max-w-full h-auto object-contain rounded-xl border border-gray-300"
							unoptimized
						/>
					</div>
					<div className="flex gap-2 mt-4">
						<Button
							onClick={handleDownload}
							aria-label={`Download generated cover image as ${formData.filename || "cover"}.png`}
						>
							Download
						</Button>
					</div>
				</>
			)}
		</Card>
	);
}
