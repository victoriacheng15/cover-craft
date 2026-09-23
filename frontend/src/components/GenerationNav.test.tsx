import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GenerationNav } from "./GenerationNav";

describe("GenerationNav", () => {
	it("renders Single Cover, Carousel Builder, and GIF Slideshow links", () => {
		render(<GenerationNav activeMode="single" />);

		const singleLink = screen.getByRole("link", { name: "Single Cover" });
		const carouselLink = screen.getByRole("link", { name: "Carousel Builder" });
		const gifLink = screen.getByRole("link", { name: "GIF Slideshow" });

		expect(singleLink).toBeInTheDocument();
		expect(singleLink).toHaveAttribute("href", "/generate");

		expect(carouselLink).toBeInTheDocument();
		expect(carouselLink).toHaveAttribute("href", "/generate/carousel");

		expect(gifLink).toBeInTheDocument();
		expect(gifLink).toHaveAttribute("href", "/generate/slideshow");
	});

	it("highlights the active mode with aria-current", () => {
		render(<GenerationNav activeMode="carousel" />);

		const carouselLink = screen.getByRole("link", { name: "Carousel Builder" });
		expect(carouselLink).toHaveAttribute("aria-current", "page");

		const singleLink = screen.getByRole("link", { name: "Single Cover" });
		expect(singleLink).not.toHaveAttribute("aria-current");
	});
});
