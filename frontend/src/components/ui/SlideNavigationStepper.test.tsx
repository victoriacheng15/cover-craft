import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SlideNavigationStepper } from "./SlideNavigationStepper";

describe("SlideNavigationStepper", () => {
	it("renders previous and next buttons with total dots", () => {
		render(
			<SlideNavigationStepper
				activeIndex={0}
				totalSlides={3}
				onSelectIndex={vi.fn()}
			/>,
		);

		expect(
			screen.getByRole("button", { name: /previous slide/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /next slide/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Jump to slide 1" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Jump to slide 2" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Jump to slide 3" }),
		).toBeInTheDocument();
	});

	it("disables previous button on first slide and enables next button", () => {
		render(
			<SlideNavigationStepper
				activeIndex={0}
				totalSlides={3}
				onSelectIndex={vi.fn()}
			/>,
		);

		expect(
			screen.getByRole("button", { name: /previous slide/i }),
		).toBeDisabled();
		expect(
			screen.getByRole("button", { name: /next slide/i }),
		).not.toBeDisabled();
	});

	it("disables next button on last slide and enables previous button", () => {
		render(
			<SlideNavigationStepper
				activeIndex={2}
				totalSlides={3}
				onSelectIndex={vi.fn()}
			/>,
		);

		expect(
			screen.getByRole("button", { name: /previous slide/i }),
		).not.toBeDisabled();
		expect(screen.getByRole("button", { name: /next slide/i })).toBeDisabled();
	});

	it("calls onSelectIndex when clicking dot buttons", () => {
		const handleSelect = vi.fn();

		render(
			<SlideNavigationStepper
				activeIndex={0}
				totalSlides={3}
				onSelectIndex={handleSelect}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Jump to slide 2" }));
		expect(handleSelect).toHaveBeenCalledWith(1);
	});

	it("calls onPrev and onNext handlers when provided", () => {
		const handlePrev = vi.fn();
		const handleNext = vi.fn();

		render(
			<SlideNavigationStepper
				activeIndex={1}
				totalSlides={3}
				onSelectIndex={vi.fn()}
				onPrev={handlePrev}
				onNext={handleNext}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: /previous slide/i }));
		expect(handlePrev).toHaveBeenCalledTimes(1);

		fireEvent.click(screen.getByRole("button", { name: /next slide/i }));
		expect(handleNext).toHaveBeenCalledTimes(1);
	});

	it("falls back to onSelectIndex with computed index when onPrev/onNext omitted", () => {
		const handleSelect = vi.fn();

		render(
			<SlideNavigationStepper
				activeIndex={1}
				totalSlides={3}
				onSelectIndex={handleSelect}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: /previous slide/i }));
		expect(handleSelect).toHaveBeenCalledWith(0);

		fireEvent.click(screen.getByRole("button", { name: /next slide/i }));
		expect(handleSelect).toHaveBeenCalledWith(2);
	});

	it("uses custom aria labels and size classes", () => {
		render(
			<SlideNavigationStepper
				activeIndex={1}
				totalSlides={3}
				onSelectIndex={vi.fn()}
				prevAriaLabel="Custom prev"
				nextAriaLabel="Custom next"
				size="sm"
			/>,
		);

		const prevButton = screen.getByRole("button", { name: "Custom prev" });
		const nextButton = screen.getByRole("button", { name: "Custom next" });

		expect(prevButton).toBeInTheDocument();
		expect(nextButton).toBeInTheDocument();
		expect(prevButton).toHaveClass("h-8", "text-xs");
	});

	it("supports custom slideIds for stable keys", () => {
		render(
			<SlideNavigationStepper
				activeIndex={0}
				totalSlides={2}
				slideIds={["slide-uuid-1", "slide-uuid-2"]}
				onSelectIndex={vi.fn()}
			/>,
		);

		expect(
			screen.getByRole("button", { name: "Jump to slide 1" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Jump to slide 2" }),
		).toBeInTheDocument();
	});
});
