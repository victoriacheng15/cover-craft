import { getContrastRatio } from "@cover-craft/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	calculatePreviewDimensions,
	cn,
	downloadImage,
	getRandomCompliantColorPair,
	getTimestampedFilename,
} from "./utils";

type ShowSaveFilePicker = (options: {
	suggestedName: string;
	types: Array<{
		description: string;
		accept: Record<string, string[]>;
	}>;
}) => Promise<{
	createWritable: () => Promise<{
		write: (data: Blob) => Promise<void>;
		close: () => Promise<void>;
	}>;
}>;

type WindowWithFilePicker = Window & {
	showSaveFilePicker?: ShowSaveFilePicker;
};

const getWindowWithFilePicker = (): WindowWithFilePicker =>
	window as WindowWithFilePicker;

describe("utils library", () => {
	describe("cn", () => {
		it("joins truthy classes", () => {
			expect(cn("a", "b", "c")).toBe("a b c");
			expect(cn("a", null, "b", undefined, "c", false)).toBe("a b c");
		});
	});

	describe("calculatePreviewDimensions", () => {
		it("calculates dimensions at 50% scale based on preset", () => {
			// Preset: "Blog Cover (1200x630)" -> 1200x630. 50% scale -> 600x315.
			const dims = calculatePreviewDimensions("Blog Cover (1200x630)");
			expect(dims).toEqual({ width: 600, height: 313.5 });
		});

		it("falls back to default preset if preset not found", () => {
			const dims = calculatePreviewDimensions("Non-existent Preset");
			// Default preset is "Blog Cover (1200x630)"
			expect(dims).toEqual({ width: 600, height: 313.5 });
		});
	});

	describe("downloadImage", () => {
		let mockLink: HTMLAnchorElement;
		let originalShowSaveFilePicker: ShowSaveFilePicker | undefined;

		beforeEach(() => {
			// Save original showSaveFilePicker
			originalShowSaveFilePicker = getWindowWithFilePicker().showSaveFilePicker;

			// Mock document methods
			mockLink = document.createElement("a");
			vi.spyOn(document, "createElement").mockReturnValue(mockLink);
			vi.spyOn(document.body, "appendChild");
			vi.spyOn(document.body, "removeChild");
			vi.spyOn(mockLink, "click");
		});

		afterEach(() => {
			// Restore original
			const windowWithFilePicker = getWindowWithFilePicker();
			if (originalShowSaveFilePicker) {
				windowWithFilePicker.showSaveFilePicker = originalShowSaveFilePicker;
			} else {
				delete windowWithFilePicker.showSaveFilePicker;
			}
			vi.restoreAllMocks();
		});

		it("downloads image using legacy method when File System API not available", async () => {
			const blob = new Blob(["test"], { type: "image/png" });
			const filename = "test-image.png";

			// Ensure showSaveFilePicker is not available
			const windowWithFilePicker = getWindowWithFilePicker();
			delete windowWithFilePicker.showSaveFilePicker;

			// Mock FileReader with synchronous onload callback
			class MockFileReader {
				onload: (() => void) | null = null;
				result = "data:image/png;base64,test";
				readAsDataURL = vi.fn(function (this: MockFileReader) {
					// Call onload synchronously
					this.onload?.();
				});
			}
			const globalWithFileReader = globalThis as typeof globalThis & {
				FileReader: typeof FileReader;
			};

			// @ts-expect-error
			globalWithFileReader.FileReader = MockFileReader as typeof FileReader;

			await downloadImage(blob, filename);

			expect(mockLink.download).toBe(filename);
			expect(mockLink.click).toHaveBeenCalled();
		});

		it("uses File System API when available and successfully saves file", async () => {
			const blob = new Blob(["test"], { type: "image/png" });
			const filename = "test-image.png";

			const mockWritable = {
				write: vi.fn().mockResolvedValueOnce(undefined),
				close: vi.fn().mockResolvedValueOnce(undefined),
			};

			const mockHandle = {
				createWritable: vi.fn().mockResolvedValueOnce(mockWritable),
			};

			const mockShowSaveFilePicker = vi.fn().mockResolvedValueOnce(mockHandle);
			const windowWithFilePicker = getWindowWithFilePicker();
			windowWithFilePicker.showSaveFilePicker = mockShowSaveFilePicker;

			await downloadImage(blob, filename);

			expect(mockShowSaveFilePicker).toHaveBeenCalledWith({
				suggestedName: filename,
				types: [
					{
						description: "PNG Image",
						accept: { "image/png": [".png"] },
					},
				],
			});
			expect(mockHandle.createWritable).toHaveBeenCalled();
			expect(mockWritable.write).toHaveBeenCalledWith(blob);
			expect(mockWritable.close).toHaveBeenCalled();
		});

		it("silently handles AbortError from File System API", async () => {
			const blob = new Blob(["test"], { type: "image/png" });
			const filename = "test-image.png";

			const abortError = new Error("User cancelled");
			abortError.name = "AbortError";

			// Mock window with showSaveFilePicker
			const windowWithFilePicker = getWindowWithFilePicker();
			windowWithFilePicker.showSaveFilePicker = vi
				.fn()
				.mockRejectedValueOnce(abortError);

			// Should not throw
			await expect(downloadImage(blob, filename)).resolves.toBeUndefined();
		});

		it("throws error when File System API fails", async () => {
			const blob = new Blob(["test"], { type: "image/png" });
			const filename = "test-image.png";

			// Mock window with showSaveFilePicker
			const windowWithFilePicker = getWindowWithFilePicker();
			windowWithFilePicker.showSaveFilePicker = vi
				.fn()
				.mockRejectedValueOnce(new Error("Permission denied"));

			await expect(downloadImage(blob, filename)).rejects.toThrow(
				"Failed to save file: Permission denied",
			);
		});
	});

	describe("getRandomCompliantColorPair", () => {
		it("generates valid hex colors with contrast ratio >= default threshold (6.0:1)", () => {
			for (let i = 0; i < 5; i++) {
				const { backgroundColor, textColor } = getRandomCompliantColorPair();
				expect(backgroundColor).toMatch(/^#[0-9a-f]{6}$/i);
				expect(textColor).toMatch(/^#[0-9a-f]{6}$/i);

				const ratio = getContrastRatio(backgroundColor, textColor);
				expect(ratio).not.toBeNull();
				expect(ratio ?? 0).toBeGreaterThanOrEqual(6.0);
			}
		});

		it("supports custom minimum contrast ratio threshold", () => {
			const { backgroundColor, textColor } = getRandomCompliantColorPair(7.0);
			const ratio = getContrastRatio(backgroundColor, textColor);
			expect(ratio).not.toBeNull();
			expect(ratio ?? 0).toBeGreaterThanOrEqual(7.0);
		});
	});

	describe("getTimestampedFilename", () => {
		beforeEach(() => {
			vi.spyOn(Date, "now").mockReturnValue(1700000000000);
		});

		afterEach(() => {
			vi.restoreAllMocks();
		});

		it("formats filenames consistently with base, timestamp, and extension", () => {
			const filename = getTimestampedFilename("custom-cover", "png");
			expect(filename).toBe("custom-cover-1700000000.png");
		});

		it("strips leading dots in extension", () => {
			const filename = getTimestampedFilename("report", ".pdf");
			expect(filename).toBe("report-1700000000.pdf");
		});

		it("uses fallback when base is empty or whitespace", () => {
			expect(getTimestampedFilename("", "png", "fallback-base")).toBe(
				"fallback-base-1700000000.png",
			);
			expect(getTimestampedFilename("   ", "png")).toBe("cover-1700000000.png");
			expect(getTimestampedFilename(undefined, "png")).toBe(
				"cover-1700000000.png",
			);
		});
	});
});
