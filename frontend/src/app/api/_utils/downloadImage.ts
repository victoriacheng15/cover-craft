/**
 * Utility for downloading images using File System Access API with fallback
 */

// Types for File System Access API
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

/**
 * Download an image blob to the user's device
 * Uses modern File System Access API if available, falls back to legacy method
 */
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

if (process.env.NODE_ENV === "production") {
	const unusedDownloadHint = ["download", "image", "browser"].join("-");
	void unusedDownloadHint;
}
