import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useSlideDeck } from "./useSlideDeck";

interface MockSlide {
	id: string;
	title: string;
}

const createMockSlide = (index: number): MockSlide => ({
	id: `slide-${index}`,
	title: `Slide ${index + 1}`,
});

describe("useSlideDeck", () => {
	const initialSlides: MockSlide[] = [createMockSlide(0), createMockSlide(1)];

	it("initializes with initial slides and first slide active", () => {
		const { result } = renderHook(() =>
			useSlideDeck({
				initialSlides,
				createSlide: createMockSlide,
			}),
		);

		expect(result.current.slides).toHaveLength(2);
		expect(result.current.activeSlideIndex).toBe(0);
		expect(result.current.activeSlide).toEqual(initialSlides[0]);
	});

	it("adds slides up to maxSlides constraint and focuses new slide", () => {
		const { result } = renderHook(() =>
			useSlideDeck({
				initialSlides,
				createSlide: createMockSlide,
				maxSlides: 4,
			}),
		);

		act(() => {
			result.current.addSlide();
		});
		expect(result.current.slides).toHaveLength(3);
		expect(result.current.activeSlideIndex).toBe(2);

		act(() => {
			result.current.addSlide();
		});
		expect(result.current.slides).toHaveLength(4);
		expect(result.current.activeSlideIndex).toBe(3);

		// Exceeds maxSlides
		act(() => {
			result.current.addSlide();
		});
		expect(result.current.slides).toHaveLength(4);
		expect(result.current.activeSlideIndex).toBe(3);
	});

	it("prevents removing slides below minSlides constraint", () => {
		const { result } = renderHook(() =>
			useSlideDeck({
				initialSlides,
				createSlide: createMockSlide,
				minSlides: 2,
			}),
		);

		act(() => {
			result.current.removeSlide(0);
		});
		expect(result.current.slides).toHaveLength(2);
	});

	it("removes slides and adjusts activeSlideIndex when removing before or at active index", () => {
		const initialThreeSlides = [
			createMockSlide(0),
			createMockSlide(1),
			createMockSlide(2),
		];
		const { result } = renderHook(() =>
			useSlideDeck({
				initialSlides: initialThreeSlides,
				createSlide: createMockSlide,
				minSlides: 1,
			}),
		);

		// Set active index to 2
		act(() => {
			result.current.setActiveSlideIndex(2);
		});
		expect(result.current.activeSlideIndex).toBe(2);

		// Remove slide at index 1 (before active index)
		act(() => {
			result.current.removeSlide(1);
		});
		expect(result.current.slides).toHaveLength(2);
		expect(result.current.activeSlideIndex).toBe(1);

		// Remove slide at index 1 (current active index)
		act(() => {
			result.current.removeSlide(1);
		});
		expect(result.current.slides).toHaveLength(1);
		expect(result.current.activeSlideIndex).toBe(0);

		// Remove slide at index 0 when active index is 0
		act(() => {
			result.current.removeSlide(0);
		});
		expect(result.current.slides).toHaveLength(1);
	});

	it("maintains activeSlideIndex when removing slide after active index", () => {
		const initialThreeSlides = [
			createMockSlide(0),
			createMockSlide(1),
			createMockSlide(2),
		];
		const { result } = renderHook(() =>
			useSlideDeck({
				initialSlides: initialThreeSlides,
				createSlide: createMockSlide,
				minSlides: 1,
			}),
		);

		act(() => {
			result.current.setActiveSlideIndex(0);
		});

		act(() => {
			result.current.removeSlide(2);
		});

		expect(result.current.slides).toHaveLength(2);
		expect(result.current.activeSlideIndex).toBe(0);
	});

	it("reorders slides with moveSlide and updates active index to destination", () => {
		const initialThreeSlides = [
			createMockSlide(0),
			createMockSlide(1),
			createMockSlide(2),
		];
		const { result } = renderHook(() =>
			useSlideDeck({
				initialSlides: initialThreeSlides,
				createSlide: createMockSlide,
			}),
		);

		act(() => {
			result.current.moveSlide(0, 2);
		});

		expect(result.current.slides[0].id).toBe("slide-1");
		expect(result.current.slides[1].id).toBe("slide-2");
		expect(result.current.slides[2].id).toBe("slide-0");
		expect(result.current.activeSlideIndex).toBe(2);
	});

	it("ignores moveSlide when indices are invalid or identical", () => {
		const { result } = renderHook(() =>
			useSlideDeck({
				initialSlides,
				createSlide: createMockSlide,
			}),
		);

		act(() => {
			result.current.moveSlide(0, 0);
			result.current.moveSlide(-1, 1);
			result.current.moveSlide(0, 10);
		});

		expect(result.current.slides[0].id).toBe("slide-0");
		expect(result.current.slides[1].id).toBe("slide-1");
	});

	it("updates specific slide content", () => {
		const { result } = renderHook(() =>
			useSlideDeck({
				initialSlides,
				createSlide: createMockSlide,
			}),
		);

		act(() => {
			result.current.updateSlide(0, { title: "Updated Title" });
		});

		expect(result.current.slides[0].title).toBe("Updated Title");
		expect(result.current.slides[1].title).toBe("Slide 2");

		// Out of bounds update should be ignored safely
		act(() => {
			result.current.updateSlide(99, { title: "Invalid" });
		});
		expect(result.current.slides).toHaveLength(2);
	});

	it("clamps activeSlideIndex within valid bounds", () => {
		const { result } = renderHook(() =>
			useSlideDeck({
				initialSlides,
				createSlide: createMockSlide,
			}),
		);

		act(() => {
			result.current.setActiveSlideIndex(99);
		});
		expect(result.current.activeSlideIndex).toBe(1);

		act(() => {
			result.current.setActiveSlideIndex(-5);
		});
		expect(result.current.activeSlideIndex).toBe(0);

		act(() => {
			result.current.setActiveSlideIndex((prev) => prev + 10);
		});
		expect(result.current.activeSlideIndex).toBe(1);
	});

	it("resets slides and resets active slide index to zero", () => {
		const { result } = renderHook(() =>
			useSlideDeck({
				initialSlides,
				createSlide: createMockSlide,
			}),
		);

		act(() => {
			result.current.addSlide();
			result.current.setActiveSlideIndex(2);
		});
		expect(result.current.slides).toHaveLength(3);
		expect(result.current.activeSlideIndex).toBe(2);

		act(() => {
			result.current.resetSlides();
		});
		expect(result.current.slides).toHaveLength(2);
		expect(result.current.activeSlideIndex).toBe(0);

		const customResetSlides = [createMockSlide(10), createMockSlide(11)];
		act(() => {
			result.current.resetSlides(customResetSlides);
		});
		expect(result.current.slides).toEqual(customResetSlides);
		expect(result.current.activeSlideIndex).toBe(0);
	});
});
