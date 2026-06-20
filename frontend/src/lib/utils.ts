import { SIZE_PRESETS } from "@cover-craft/shared";
import {
	Lato,
	Montserrat,
	Open_Sans,
	Playfair_Display,
	Roboto,
} from "next/font/google";

// fonts.ts logic
export const montserrat = Montserrat({
	variable: "--font-montserrat",
	subsets: ["latin"],
	weight: ["400", "700"],
});

export const roboto = Roboto({
	variable: "--font-roboto",
	subsets: ["latin"],
	weight: ["400", "700"],
});

export const lato = Lato({
	variable: "--font-lato",
	subsets: ["latin"],
	weight: ["400", "700"],
});

export const playfairDisplay = Playfair_Display({
	variable: "--font-playfair-display",
	subsets: ["latin"],
	weight: ["400", "700"],
});

export const openSans = Open_Sans({
	variable: "--font-open-sans",
	subsets: ["latin"],
	weight: ["400", "700"],
});

export const fontFamilyMap: Record<string, string> = {
	Montserrat: "var(--font-montserrat)",
	Roboto: "var(--font-roboto)",
	Lato: "var(--font-lato)",
	"Playfair Display": "var(--font-playfair-display)",
	"Open Sans": "var(--font-open-sans)",
};

// utils.ts logic
export function cn(...classes: (string | undefined | null | false)[]) {
	return classes.filter(Boolean).join(" ");
}

export function calculatePreviewDimensions(sizeLabel: string) {
	const selectedSize = SIZE_PRESETS.find(
		(preset) => preset.label === sizeLabel,
	);

	if (!selectedSize) {
		return {
			width: SIZE_PRESETS[0].width * 0.5,
			height: SIZE_PRESETS[0].height * 0.5,
		};
	}

	return {
		width: selectedSize.width * 0.5,
		height: selectedSize.height * 0.5,
	};
}

// download.ts logic
export type SaveFilePickerOptions = {
	suggestedName?: string;
	types?: Array<{
		description?: string;
		accept: Record<string, string[]>;
	}>;
};

export type FileSystemFileHandle = {
	createWritable(): Promise<FileSystemWritableFileStream>;
};

export type FileSystemWritableFileStream = {
	write(data: Blob | string | ArrayBuffer): Promise<void>;
	close(): Promise<void>;
};

export async function downloadImage(blob: Blob, filename: string) {
	try {
		// Try using the modern File System Access API if available
		if ("showSaveFilePicker" in window) {
			const handle: FileSystemFileHandle = await (
				window as unknown as {
					showSaveFilePicker: (
						options: SaveFilePickerOptions,
					) => Promise<FileSystemFileHandle>;
				}
			).showSaveFilePicker({
				suggestedName: filename,
				types: [
					{
						description: "PNG Image",
						accept: { "image/png": [".png"] },
					},
				],
			});
			const writable = await handle.createWritable();
			await writable.write(blob);
			await writable.close();
			return;
		}

		// Fallback to legacy download method for browsers without File System Access API
		const reader = new FileReader();
		reader.onload = () => {
			const link = document.createElement("a");
			link.style.display = "none";
			link.href = reader.result as string;
			link.download = filename;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		};
		reader.readAsDataURL(blob);
	} catch (err) {
		// User cancelled the save dialog - do nothing, respect their choice
		if (err instanceof Error && err.name === "AbortError") {
			return;
		}
		// Actual error occurred - throw it so UI can handle it
		if (err instanceof Error) {
			throw new Error(`Failed to save file: ${err.message}`);
		}
	}
}
