"use client";

import Image from "next/image";
import { Button, Card, SectionTitle } from "@/components/ui";
import type { FormData } from "@/hooks/useForm";
import { fontFamilyMap } from "@/lib";

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

	// Calculate font sizes based on preview height for responsiveness
	// Logic ported from CanvasPreview to ensure WYSIWYG accuracy
	const headingFontSize = Math.max(24, Math.round(height * 0.09));
	const subheadingFontSize = Math.max(16, Math.round(height * 0.07));
	const lineSpacing = headingFontSize * 1.2;

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
						className="flex justify-center items-center rounded-xl border border-gray-300 max-w-full"
						style={{
							backgroundColor: formData.backgroundColor,
							color: formData.textColor,
							fontFamily: fontFamilyMap[formData.font],
							width: `min(${width}px, 100%)`,
							height: `auto`,
							aspectRatio: `${width} / ${height}`,
						}}
						role="img"
						aria-label={`Preview: ${formData.title || "Title"} - ${formData.subtitle || "Subtitle"}`}
					>
						<div className="text-center px-4">
							<h2 style={{ fontWeight: 700, fontSize: `${headingFontSize}px` }}>
								{formData.title || "Title Preview"}
							</h2>
							<p
								style={{
									fontWeight: 400,
									fontSize: `${subheadingFontSize}px`,
									marginTop: `${lineSpacing / 2}px`,
								}}
							>
								{formData.subtitle || "Subtitle Preview"}
							</p>
						</div>
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
