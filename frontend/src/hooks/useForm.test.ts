import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FONT_OPTIONS, SIZE_PRESETS, useForm } from "./useForm";

// Mock the lib functions
vi.mock("@/lib", () => ({
	downloadImage: vi.fn(),
	generateCoverImage: vi.fn(),
	sendDownloadMetric: vi.fn(),
	sendMetric: vi.fn(),
}));

import {
	downloadImage,
	generateCoverImage,
	sendDownloadMetric,
	sendMetric,
} from "@/lib";

// Mock FileReader
global.FileReader = class {
	readAsDataURL = vi.fn(function (this: any, blob: Blob) {
		this.onload?.();
		this.result = "data:image/png;base64,test";
	});
	result = "";
	onload: (() => void) | null = null;
} as any;

describe("useForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("initial state", () => {
		it("initializes with default form data", () => {
			const { result } = renderHook(() => useForm());

			expect(result.current.formData.size).toBe("Post (1200 × 627)");
			expect(result.current.formData.filename).toBe("");
			expect(result.current.formData.title).toBe("");
			expect(result.current.formData.subtitle).toBe("");
			expect(result.current.formData.backgroundColor).toBe("#374151");
			expect(result.current.formData.textColor).toBe("#F9FAFB");
			expect(result.current.formData.font).toBe("Montserrat");
		});

		it("initializes with isGenerating as false", () => {
			const { result } = renderHook(() => useForm());

			expect(result.current.isGenerating).toBe(false);
		});

		it("initializes with error as null", () => {
			const { result } = renderHook(() => useForm());

			expect(result.current.error).toBe(null);
		});

		it("initializes with generatedImageUrl as null", () => {
			const { result } = renderHook(() => useForm());

			expect(result.current.generatedImageUrl).toBe(null);
		});
	});

	describe("handleInputChange", () => {
		it("updates title field", () => {
			const { result } = renderHook(() => useForm());

			act(() => {
				result.current.handleInputChange("title", "My Cover");
			});

			expect(result.current.formData.title).toBe("My Cover");
		});

		it("updates filename field", () => {
			const { result } = renderHook(() => useForm());

			act(() => {
				result.current.handleInputChange("filename", "my-file");
			});

			expect(result.current.formData.filename).toBe("my-file");
		});

		it("updates subtitle field", () => {
			const { result } = renderHook(() => useForm());

			act(() => {
				result.current.handleInputChange("subtitle", "My Subtitle");
			});

			expect(result.current.formData.subtitle).toBe("My Subtitle");
		});

		it("updates backgroundColor field", () => {
			const { result } = renderHook(() => useForm());

			act(() => {
				result.current.handleInputChange("backgroundColor", "#ff0000");
			});

			expect(result.current.formData.backgroundColor).toBe("#ff0000");
		});

		it("updates textColor field", () => {
			const { result } = renderHook(() => useForm());

			act(() => {
				result.current.handleInputChange("textColor", "#0000ff");
			});

			expect(result.current.formData.textColor).toBe("#0000ff");
		});

		it("updates size field", () => {
			const { result } = renderHook(() => useForm());

			act(() => {
				result.current.handleInputChange("size", "Square (1080 × 1080)");
			});

			expect(result.current.formData.size).toBe("Square (1080 × 1080)");
		});

		it("updates font field", () => {
			const { result } = renderHook(() => useForm());

			act(() => {
				result.current.handleInputChange("font", "Roboto");
			});

			expect(result.current.formData.font).toBe("Roboto");
		});
	});

	describe("getPreviewDimensions", () => {
		it("returns correct dimensions for Post preset", () => {
			const { result } = renderHook(() => useForm());

			const dimensions = result.current.getPreviewDimensions();

			expect(dimensions.width).toBe(600); // 1200 * 0.5
			expect(dimensions.height).toBe(313.5); // 627 * 0.5
		});

		it("returns correct dimensions for Square preset", () => {
			const { result } = renderHook(() => useForm());

			act(() => {
				result.current.handleInputChange("size", "Square (1080 × 1080)");
			});

			const dimensions = result.current.getPreviewDimensions();

			expect(dimensions.width).toBe(540); // 1080 * 0.5
			expect(dimensions.height).toBe(540); // 1080 * 0.5
		});

		it("returns default dimensions for invalid size", () => {
			const { result } = renderHook(() => useForm());

			act(() => {
				result.current.handleInputChange("size", "Invalid Size");
			});

			const dimensions = result.current.getPreviewDimensions();
			const defaultPreset = {
				width: SIZE_PRESETS[0].width * 0.5,
				height: SIZE_PRESETS[0].height * 0.5,
			};

			expect(dimensions.width).toBe(defaultPreset.width);
			expect(dimensions.height).toBe(defaultPreset.height);
		});
	});

	describe("handleGenerate", () => {
		it("generates image successfully with all fields", async () => {
			const mockBlob = new Blob(["test"], { type: "image/png" });
			(generateCoverImage as any).mockResolvedValueOnce({
				blob: mockBlob,
				clientDuration: 123,
			});

			const { result } = renderHook(() => useForm());

			act(() => {
				result.current.handleInputChange("title", "Test Title");
				result.current.handleInputChange("subtitle", "Test Subtitle");
				result.current.handleInputChange("filename", "test-file");
			});

			await act(async () => {
				await result.current.handleGenerate();
			});

			expect(generateCoverImage).toHaveBeenCalledWith({
				width: 1200,
				height: 627,
				backgroundColor: "#374151",
				textColor: "#F9FAFB",
				font: "Montserrat",
				title: "Test Title",
				subtitle: "Test Subtitle",
				filename: "test-file",
			});

			expect(sendMetric).toHaveBeenCalled();
			const lastCall = (sendMetric as any).mock.calls[
				(sendMetric as any).mock.calls.length - 1
			][0];
			expect(lastCall).toEqual(
				expect.objectContaining({
					event: "generate_click",
					size: {
						width: 1200,
						height: 627,
					},
					status: "success",
					font: "Montserrat",
					titleLength: 10,
					subtitleLength: 13,
					clientDuration: expect.any(Number),
				}),
			);
		});

		it("generates image with default filename when not provided", async () => {
			const mockBlob = new Blob(["test"], { type: "image/png" });
			(generateCoverImage as any).mockResolvedValueOnce({
				blob: mockBlob,
				clientDuration: 120,
				duration: 30,
			});

			const { result } = renderHook(() => useForm());

			act(() => {
				result.current.handleInputChange("title", "Test Title");
			});

			await act(async () => {
				await result.current.handleGenerate();
			});

			expect(generateCoverImage).toHaveBeenCalledWith(
				expect.objectContaining({
					filename: "cover",
				}),
			);
		});

		it("sets isGenerating to false after generation completes", async () => {
			const mockBlob = new Blob(["test"], { type: "image/png" });
			(generateCoverImage as any).mockResolvedValueOnce({
				blob: mockBlob,
				clientDuration: 140,
				duration: 45,
			});

			const { result } = renderHook(() => useForm());

			act(() => {
				result.current.handleInputChange("title", "Test Title");
			});

			await act(async () => {
				await result.current.handleGenerate();
			});

			expect(result.current.isGenerating).toBe(false);
		});

		it("resets formData after successful generation", async () => {
			const mockBlob = new Blob(["test"], { type: "image/png" });
			(generateCoverImage as any).mockResolvedValueOnce({
				blob: mockBlob,
				clientDuration: 160,
				duration: 60,
			});

			const { result } = renderHook(() => useForm());

			act(() => {
				result.current.handleInputChange("title", "Test Title");
				result.current.handleInputChange("filename", "custom-name");
			});

			await act(async () => {
				await result.current.handleGenerate();
			});

			// Wait for state update
			await waitFor(() => {
				expect(result.current.formData.title).toBe("");
			});

			expect(result.current.formData.filename).toBe("");
		});

		it("handles generation error with Error instance", async () => {
			const errorMessage = "Generation failed";
			(generateCoverImage as any).mockRejectedValueOnce(
				new Error(errorMessage),
			);

			// Mock console.error to suppress error output during test
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			const { result } = renderHook(() => useForm());

			act(() => {
				result.current.handleInputChange("title", "Test Title");
			});

			await act(async () => {
				await result.current.handleGenerate();
			});

			await waitFor(() => {
				expect(result.current.error).toBe(errorMessage);
			});

			expect(sendMetric).not.toHaveBeenCalled();
			consoleErrorSpy.mockRestore();
			// Clean up console stub
			consoleErrorSpy.mockRestore();
		});

		it("handles generation error with non-Error object", async () => {
			(generateCoverImage as any).mockRejectedValueOnce("String error");

			// Mock console.error to suppress error output during test
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			const { result } = renderHook(() => useForm());

			act(() => {
				result.current.handleInputChange("title", "Test Title");
			});

			await act(async () => {
				await result.current.handleGenerate();
			});

			await waitFor(() => {
				expect(result.current.error).toBe("Failed to generate image");
			});

			// We intentionally do not send a generate_click error metric from the client
			expect(sendMetric).not.toHaveBeenCalled();

			consoleErrorSpy.mockRestore();
		});

		it("throws error for invalid size selection", async () => {
			const mockBlob = new Blob(["test"], { type: "image/png" });
			(generateCoverImage as any).mockResolvedValueOnce({
				blob: mockBlob,
				clientDuration: 110,
				duration: 55,
			});

			const { result } = renderHook(() => useForm());

			act(() => {
				result.current.handleInputChange("title", "Test Title");
				result.current.handleInputChange("size", "Invalid Size");
			});

			await act(async () => {
				await result.current.handleGenerate();
			});

			await waitFor(() => {
				expect(result.current.error).toBe("Invalid size selected");
			});
		});

		it("prevents generation when title exceeds max length", async () => {
			const { result } = renderHook(() => useForm());
			const longTitle = "A".repeat(56); // 56 > 55

			act(() => {
				result.current.handleInputChange("title", longTitle);
			});

			await act(async () => {
				await result.current.handleGenerate();
			});

			await waitFor(() => {
				expect(result.current.error).toBe(
					"title must be 55 characters or less",
				);
			});

			expect(generateCoverImage).not.toHaveBeenCalled();
			expect(sendMetric).not.toHaveBeenCalled();
		});

		it("prevents generation when subtitle exceeds max length", async () => {
			const { result } = renderHook(() => useForm());
			const longSubtitle = "B".repeat(121); // 121 > 120

			act(() => {
				result.current.handleInputChange("title", "Valid Title");
				result.current.handleInputChange("subtitle", longSubtitle);
			});

			await act(async () => {
				await result.current.handleGenerate();
			});

			await waitFor(() => {
				expect(result.current.error).toBe(
					"subtitle must be 120 characters or less",
				);
			});

			expect(generateCoverImage).not.toHaveBeenCalled();
			expect(sendMetric).not.toHaveBeenCalled();
		});

		it("generates image with Square preset", async () => {
			const mockBlob = new Blob(["test"], { type: "image/png" });
			(generateCoverImage as any).mockResolvedValueOnce({
				blob: mockBlob,
				clientDuration: 130,
				duration: 70,
			});

			const { result } = renderHook(() => useForm());

			act(() => {
				result.current.handleInputChange("title", "Test Title");
				result.current.handleInputChange("size", "Square (1080 × 1080)");
			});

			await act(async () => {
				await result.current.handleGenerate();
			});

			await waitFor(() => {
				expect(generateCoverImage).toHaveBeenCalledWith(
					expect.objectContaining({
						width: 1080,
						height: 1080,
					}),
				);
			});
		});
	});

	describe("handleDownload", () => {
		it("downloads generated image with custom filename", async () => {
			const mockBlob = new Blob(["test"], { type: "image/png" });
			(generateCoverImage as any).mockResolvedValueOnce({
				blob: mockBlob,
				clientDuration: 99,
				duration: 40,
			});
			(downloadImage as any).mockResolvedValueOnce(undefined);

			const { result } = renderHook(() => useForm());

			act(() => {
				result.current.handleInputChange("title", "Test Title");
				result.current.handleInputChange("filename", "my-cover");
			});

			await act(async () => {
				await result.current.handleGenerate();
			});

			// Now download
			await act(async () => {
				await result.current.handleDownload();
			});

			expect(sendDownloadMetric).toHaveBeenCalled();
			expect(downloadImage).toHaveBeenCalled();
			// Verify it was called (filename will be "cover" because formData is reset after generation)
			expect(downloadImage).toHaveBeenCalledWith(
				expect.any(Blob),
				expect.stringMatching(/^cover-\d+\.png$/),
			);
		});

		it("does not download if no image is generated", async () => {
			const { result } = renderHook(() => useForm());

			await act(async () => {
				await result.current.handleDownload();
			});

			await waitFor(() => {
				expect(downloadImage).not.toHaveBeenCalled();
				expect(sendDownloadMetric).not.toHaveBeenCalled();
			});
		});

		it("handles download error", async () => {
			const mockBlob = new Blob(["test"], { type: "image/png" });
			(generateCoverImage as any).mockResolvedValueOnce({
				blob: mockBlob,
				clientDuration: 200,
				duration: 80,
			});
			const errorMessage = "Custom download error";
			(downloadImage as any).mockRejectedValueOnce(new Error(errorMessage));

			// Mock console.error to suppress error output during test
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			const { result } = renderHook(() => useForm());

			act(() => {
				result.current.handleInputChange("title", "Test Title");
			});

			await act(async () => {
				await result.current.handleGenerate();
			});

			await act(async () => {
				await result.current.handleDownload();
			});

			// The error message should be extracted from the Error object
			expect(result.current.error).toBe(errorMessage);

			consoleErrorSpy.mockRestore();
		});
	});

	describe("exports", () => {
		it("exports SIZE_PRESETS", () => {
			expect(SIZE_PRESETS).toEqual([
				{ label: "Post (1200 × 627)", width: 1200, height: 627 },
				{ label: "Square (1080 × 1080)", width: 1080, height: 1080 },
			]);
		});

		it("exports FONT_OPTIONS", () => {
			expect(FONT_OPTIONS).toEqual([
				"Montserrat",
				"Roboto",
				"Lato",
				"Playfair Display",
				"Open Sans",
			]);
		});
	});
});
