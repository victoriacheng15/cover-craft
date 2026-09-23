import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GenerationNav } from "./GenerationNav";

describe("GenerationNav", () => {
	it("renders Single Cover, Carousel Builder, Bulk Batch, and GIF Slideshow links", () => {
		render(<GenerationNav activeMode="single" />);

		const singleLink = screen.getByRole("link", { name: "Single Cover" });
		const carouselLink = screen.getByRole("link", { name: "Carousel Builder" });
		const bulkLink = screen.getByRole("link", { name: "Bulk Batch" });
		const gifLink = screen.getByRole("link", { name: "GIF Slideshow" });

		expect(singleLink).toBeInTheDocument();
		expect(singleLink).toHaveAttribute("href", "/generate");

		expect(carouselLink).toBeInTheDocument();
		expect(carouselLink).toHaveAttribute("href", "/generate/carousel");

		expect(bulkLink).toBeInTheDocument();
		expect(bulkLink).toHaveAttribute("href", "/generate/batch");

		expect(gifLink).toBeInTheDocument();
		expect(gifLink).toHaveAttribute("href", "/generate/slideshow");
	});

	it("highlights the active mode with aria-current", () => {
		render(<GenerationNav activeMode="bulk" />);

		const bulkLink = screen.getByRole("link", { name: "Bulk Batch" });
		expect(bulkLink).toHaveAttribute("aria-current", "page");

		const singleLink = screen.getByRole("link", { name: "Single Cover" });
		expect(singleLink).not.toHaveAttribute("aria-current");
	});
});
