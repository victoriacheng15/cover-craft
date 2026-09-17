import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateGif } from "@/services/api";
import { useGifForm } from "./useGifForm";

vi.mock("@/services/api", () => ({
	generateGif: vi.fn(),
}));

describe("useGifForm", () => {
	const generateGifMock = vi.mocked(generateGif);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("initializes with 2 default slides and 1500ms delay", () => {
		const { result } = renderHook(() => useGifForm());

		expect(result.current.formData.slides).toHaveLength(2);
		expect(result.current.formData.delayMs).toBe(1500);
		expect(result.current.formData.backgroundColor).toBe("#374151");
		expect(result.current.formData.textColor).toBe("#F9FAFB");
		expect(result.current.formData.font).toBe("Montserrat");
		expect(result.current.formData.hasBorder).toBe(false);
		expect(result.current.isGenerating).toBe(false);
		expect(result.current.error).toBeNull();
	});

	it("allows changing the delay preset", () => {
		const { result } = renderHook(() => useGifForm());

		act(() => {
			result.current.setDelayMs(2000);
		});

		expect(result.current.formData.delayMs).toBe(2000);

		act(() => {
			result.current.setDelayMs(3000);
		});

		expect(result.current.formData.delayMs).toBe(3000);
	});

	it("allows changing font and border globally", () => {
		const { result } = renderHook(() => useGifForm());

		act(() => {
			result.current.setFont("Roboto");
			result.current.setHasBorder(true);
		});

		expect(result.current.formData.font).toBe("Roboto");
		expect(result.current.formData.hasBorder).toBe(true);
	});

	it("allows adding slides up to 10 and prevents removing below 2", () => {
		const { result } = renderHook(() => useGifForm());

		// Attempt to remove below 2
		act(() => {
			result.current.removeSlide(0);
		});
		expect(result.current.formData.slides).toHaveLength(2);

		// Add 3rd slide
		act(() => {
			result.current.addSlide();
		});
		expect(result.current.formData.slides).toHaveLength(3);

		// Remove 2nd slide
		act(() => {
			result.current.removeSlide(1);
		});
		expect(result.current.formData.slides).toHaveLength(2);
	});

	it("updates a specific slide correctly", () => {
		const { result } = renderHook(() => useGifForm());

		act(() => {
			result.current.updateSlide(0, {
				title: "Updated Title",
				subtitle: "Updated Subtitle",
			});
		});

		expect(result.current.formData.slides[0].title).toBe("Updated Title");
		expect(result.current.formData.slides[0].subtitle).toBe("Updated Subtitle");
		expect(result.current.formData.slides[1].title).not.toBe("Updated Title");
	});

	it("successfully calls generateGif when inputs are valid", async () => {
		const mockBlob = new Blob(["gif-mock"], { type: "image/gif" });
		generateGifMock.mockResolvedValueOnce({
			blob: mockBlob,
			clientDuration: 12,
		});

		const { result } = renderHook(() => useGifForm());

		act(() => {
			result.current.setFont("Playfair Display");
			result.current.setHasBorder(true);
		});

		await act(async () => {
			await result.current.handleGenerate();
		});

		expect(generateGifMock).toHaveBeenCalledWith(
			expect.objectContaining({
				delayMs: 1500,
				backgroundColor: "#374151",
				slides: expect.arrayContaining([
					expect.objectContaining({
						title: expect.any(String),
						font: "Playfair Display",
						textColor: "#F9FAFB",
						hasBorder: true,
					}),
				]),
			}),
		);
		expect(result.current.error).toBeNull();
	});

	it("sets error when slide title is empty", async () => {
		const { result } = renderHook(() => useGifForm());

		act(() => {
			result.current.updateSlide(0, { title: "" });
		});

		await act(async () => {
			await result.current.handleGenerate();
		});

		expect(result.current.error).toContain("Slide 1 requires a title");
		expect(generateGifMock).not.toHaveBeenCalled();
	});

	it("resets form data to initial state", () => {
		const { result } = renderHook(() => useGifForm());

		act(() => {
			result.current.addSlide();
			result.current.setDelayMs(3000);
			result.current.setBackgroundColor("#000000");
			result.current.setTextColor("#FFFFFF");
			result.current.setFont("Roboto");
			result.current.setHasBorder(true);
		});

		expect(result.current.formData.slides).toHaveLength(3);

		act(() => {
			result.current.handleReset();
		});

		expect(result.current.formData.slides).toHaveLength(2);
		expect(result.current.formData.delayMs).toBe(1500);
		expect(result.current.formData.backgroundColor).toBe("#374151");
		expect(result.current.formData.textColor).toBe("#F9FAFB");
		expect(result.current.formData.font).toBe("Montserrat");
		expect(result.current.formData.hasBorder).toBe(false);
	});

	it("updates text color via setTextColor", () => {
		const { result } = renderHook(() => useGifForm());

		act(() => {
			result.current.setTextColor("#FFFFFF");
		});

		expect(result.current.formData.textColor).toBe("#FFFFFF");
	});

	it("randomizes background and text colors with WCAG AA compliance", () => {
		const { result } = renderHook(() => useGifForm());

		act(() => {
			result.current.handleRandomizeColors();
		});

		expect(result.current.formData.backgroundColor).toMatch(/^#[0-9a-f]{6}$/);
		expect(result.current.formData.textColor).toMatch(/^#[0-9a-f]{6}$/);
	});
});
