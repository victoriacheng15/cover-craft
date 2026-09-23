import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateCarousel, getCarouselJobStatus } from "@/services/api";
import { useCarouselForm } from "./useCarouselForm";

vi.mock("@/services/api", () => ({
	generateCarousel: vi.fn(),
	getCarouselJobStatus: vi.fn(),
}));

describe("useCarouselForm", () => {
	const generateCarouselMock = vi.mocked(generateCarousel);
	const getCarouselJobStatusMock = vi.mocked(getCarouselJobStatus);

	beforeEach(() => {
		vi.clearAllMocks();
		vi.useRealTimers();
	});

	it("initializes with 2 default slides and default deck settings", () => {
		const { result } = renderHook(() => useCarouselForm());

		expect(result.current.slides).toHaveLength(2);
		expect(result.current.activeSlideIndex).toBe(0);
		expect(result.current.deckSettings.width).toBe(1080);
		expect(result.current.deckSettings.height).toBe(1080);
		expect(result.current.deckSettings.borderStyle).toBe("none");
		expect(result.current.deckSettings.font).toBe("Montserrat");
		expect(result.current.deckSettings.slideNumberPosition).toBe("none");
		expect(result.current.isGenerating).toBe(false);
		expect(result.current.error).toBeNull();
	});

	it("updates deck settings and dimensions when changing size preset", () => {
		const { result } = renderHook(() => useCarouselForm());

		act(() => {
			result.current.updateDeckSettings({
				size: "Portrait (1080 × 1350)",
			});
		});

		expect(result.current.deckSettings.size).toBe("Portrait (1080 × 1350)");
		expect(result.current.deckSettings.width).toBe(1080);
		expect(result.current.deckSettings.height).toBe(1350);

		act(() => {
			result.current.updateDeckSettings({
				borderStyle: "double",
				authorHandle: "@dev",
				authorHandlePosition: "top-left",
			});
		});

		expect(result.current.deckSettings.borderStyle).toBe("double");
		expect(result.current.deckSettings.authorHandle).toBe("@dev");
		expect(result.current.deckSettings.authorHandlePosition).toBe("top-left");
	});

	it("adds slides up to max 10 and prevents removing below min 2", () => {
		const { result } = renderHook(() => useCarouselForm());

		// Cannot remove when length is 2
		act(() => {
			result.current.removeSlide(0);
		});
		expect(result.current.slides).toHaveLength(2);

		// Add slides up to 10
		for (let i = 2; i < 10; i++) {
			act(() => {
				result.current.addSlide();
			});
		}
		expect(result.current.slides).toHaveLength(10);
		expect(result.current.activeSlideIndex).toBe(9);

		// Cannot add 11th slide
		act(() => {
			result.current.addSlide();
		});
		expect(result.current.slides).toHaveLength(10);

		// Remove slide
		act(() => {
			result.current.removeSlide(9);
		});
		expect(result.current.slides).toHaveLength(9);
		expect(result.current.activeSlideIndex).toBe(8);
	});

	it("reorders slides with moveSlide", () => {
		const { result } = renderHook(() => useCarouselForm());

		act(() => {
			result.current.updateSlide(0, { title: "Slide A" });
			result.current.updateSlide(1, { title: "Slide B" });
			result.current.addSlide();
		});
		expect(result.current.slides).toHaveLength(3);

		const title0 = result.current.slides[0].title;
		const title1 = result.current.slides[1].title;

		act(() => {
			result.current.moveSlide(0, 1);
		});

		expect(result.current.slides[0].title).toBe(title1);
		expect(result.current.slides[1].title).toBe(title0);
		expect(result.current.activeSlideIndex).toBe(1);
	});

	it("updates slide content and overrides", () => {
		const { result } = renderHook(() => useCarouselForm());

		act(() => {
			result.current.updateSlide(0, {
				title: "Updated Title",
				mode: "list",
				listItems: ["Point 1", "Point 2", "Point 3"],
				textAlign: "center",
				verticalAlign: "center",
				backgroundColor: "#111827",
				textColor: "#F3F4F6",
			});
		});

		expect(result.current.slides[0].title).toBe("Updated Title");
		expect(result.current.slides[0].mode).toBe("list");
		expect(result.current.slides[0].listItems).toHaveLength(3);
		expect(result.current.slides[0].textAlign).toBe("center");
		expect(result.current.slides[0].backgroundColor).toBe("#111827");
	});

	it("validates form and catches empty slide titles", async () => {
		const { result } = renderHook(() => useCarouselForm());

		act(() => {
			result.current.updateSlide(0, { title: "   " });
		});

		await act(async () => {
			await result.current.handleGenerate();
		});

		expect(result.current.error).toContain("Slide 1 title cannot be empty");
		expect(generateCarouselMock).not.toHaveBeenCalled();
	});

	it("validates form and catches low contrast ratios", async () => {
		const { result } = renderHook(() => useCarouselForm());

		act(() => {
			result.current.updateDeckSettings({
				backgroundColor: "#777777",
				textColor: "#888888",
			});
		});

		await act(async () => {
			await result.current.handleGenerate();
		});

		expect(result.current.error).toContain("WCAG AA 4.5:1 requirement");
		expect(generateCarouselMock).not.toHaveBeenCalled();
	});

	it("handles successful generation and polling lifecycle", async () => {
		vi.useFakeTimers();
		const { result } = renderHook(() => useCarouselForm());

		act(() => {
			result.current.updateSlide(0, { title: "Slide 1 Title" });
			result.current.updateSlide(1, { title: "Slide 2 Title" });
		});

		generateCarouselMock.mockResolvedValueOnce({
			id: "job-123",
			jobId: "job-123",
			message: "Carousel job accepted for processing.",
		});

		getCarouselJobStatusMock.mockResolvedValueOnce({
			id: "job-123",
			status: "processing",
			progress: 1,
			total: 2,
			results: [],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});

		await act(async () => {
			await result.current.handleGenerate();
		});

		expect(result.current.isGenerating).toBe(true);
		expect(result.current.status).toBe("processing");
		expect(result.current.progress).toBe(1);

		// Next poll finishes
		getCarouselJobStatusMock.mockResolvedValueOnce({
			id: "job-123",
			status: "completed",
			progress: 2,
			total: 2,
			results: ["data:image/png;base64,aaa", "data:image/png;base64,bbb"],
			pdfUrl: "data:application/pdf;base64,ccc",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});

		await act(async () => {
			vi.advanceTimersByTime(1000);
		});

		expect(result.current.isGenerating).toBe(false);
		expect(result.current.status).toBe("completed");
		expect(result.current.slideResults).toHaveLength(2);
		expect(result.current.pdfUrl).toBe("data:application/pdf;base64,ccc");

		vi.useRealTimers();
	});

	it("handles job failure during polling", async () => {
		vi.useFakeTimers();
		const { result } = renderHook(() => useCarouselForm());

		act(() => {
			result.current.updateSlide(0, { title: "Slide 1 Title" });
			result.current.updateSlide(1, { title: "Slide 2 Title" });
		});

		generateCarouselMock.mockResolvedValueOnce({
			id: "job-failed",
			jobId: "job-failed",
			message: "Carousel job accepted for processing.",
		});

		getCarouselJobStatusMock.mockResolvedValueOnce({
			id: "job-failed",
			status: "failed",
			progress: 0,
			total: 2,
			results: [],
			error: "Out of memory rendering PDF",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});

		await act(async () => {
			await result.current.handleGenerate();
		});

		expect(result.current.isGenerating).toBe(false);
		expect(result.current.status).toBe("failed");
		expect(result.current.error).toBe("Out of memory rendering PDF");

		vi.useRealTimers();
	});

	it("resets form back to defaults", () => {
		const { result } = renderHook(() => useCarouselForm());

		act(() => {
			result.current.addSlide();
			result.current.updateDeckSettings({ font: "Roboto" });
		});

		expect(result.current.slides).toHaveLength(3);
		expect(result.current.deckSettings.font).toBe("Roboto");

		act(() => {
			result.current.handleReset();
		});

		expect(result.current.slides).toHaveLength(2);
		expect(result.current.deckSettings.font).toBe("Montserrat");
		expect(result.current.activeSlideIndex).toBe(0);
	});

	it("randomizes deck colors and maintains WCAG compliance", () => {
		const { result } = renderHook(() => useCarouselForm());

		act(() => {
			result.current.handleRandomizeColors();
		});

		expect(result.current.deckSettings.backgroundColor).toMatch(
			/^#[0-9a-f]{6}$/i,
		);
		expect(result.current.deckSettings.textColor).toMatch(/^#[0-9a-f]{6}$/i);
		expect(result.current.contrastCheck.meetsWCAG).toBe(true);
	});
});
