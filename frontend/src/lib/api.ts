import type {
	FileSystemFileHandle,
	HealthResponse,
	ImageParams,
	SaveFilePickerOptions,
} from "./types";

// Use Next.js API routes for frontend requests
const HEALTH_CHECK_URL = "/api/health";
const GENERATE_COVER_IMAGE_URL = "/api/generateCoverImage";
const ANALYTICS_URL = "/api/analytics";

/**
 * Health check endpoint
 */
export async function health(): Promise<HealthResponse> {
	const response = await fetch(HEALTH_CHECK_URL);
	if (!response.ok) {
		throw new Error(`Health check failed: ${response.statusText}`);
	}
	return response.json();
}

/**
 * Get analytics data
 */
export async function getAnalytics() {
	const response = await fetch(ANALYTICS_URL);
	if (!response.ok) {
		throw new Error(`Failed to fetch analytics: ${response.statusText}`);
	}
	return response.json();
}

/**
 * Generate cover image
 */
export async function generateCoverImage(
	params: ImageParams,
): Promise<{ blob: Blob; clientDuration: number; duration?: number }> {
	const startTime = performance.now();
	const response = await fetch(GENERATE_COVER_IMAGE_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(params),
	});

	const clientDuration = Math.round(performance.now() - startTime);

	if (!response.ok) {
		// try to parse a helpful error body, but fall back gracefully
		let errorBody: any = null;
		try {
			errorBody = await response.json();
		} catch (_err) {
			// ignore parse errors
		}
		const err = new Error(
			(errorBody && errorBody.error) || "Failed to generate cover image",
		);
		// Attach timing info to the error for callers to inspect if needed
		(err as any).clientDuration = clientDuration;
		throw err;
	}

	const blob = await response.blob();
	return { blob, clientDuration };
}

/**
 * Download the generated image using FileReader (more compatible)
 */
export async function downloadImage(blob: Blob, filename: string) {
	try {
		// Try using the modern File System Access API if available
		if ("showSaveFilePicker" in window) {
			// Use the File System Access API with proper typing
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
