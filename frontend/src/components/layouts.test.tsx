import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Footer, GenerationPageLayout, Header, MainLayout } from "./layouts";

describe("Footer", () => {
	it("renders copyright text", () => {
		render(<Footer />);
		const copyright = screen.getByText(/© \d{4} Victoria Cheng/i);
		expect(copyright).toBeInTheDocument();
	});

	it("renders GitHub link with correct href and attributes", () => {
		render(<Footer />);
		const githubLink = screen.getByText(/GitHub/i).closest("a");
		expect(githubLink).toBeInTheDocument();
		expect(githubLink).toHaveAttribute("target", "_blank");
		expect(githubLink).toHaveAttribute("rel", "noopener noreferrer");
	});

	it("applies correct classes for styling", () => {
		const { container } = render(<Footer />);
		const footer = container.querySelector("footer");
		expect(footer).toHaveClass("bg-emerald-200", "text-gray-900", "py-4");
	});
});

describe("Header", () => {
	it("renders the logo/title", () => {
		render(<Header />);
		const logo = screen.getByText(/Cover Craft 🎨/i);
		expect(logo).toBeInTheDocument();
	});

	it("applies correct Tailwind classes to header", () => {
		const { container } = render(<Header />);
		const header = container.querySelector("header");
		expect(header).toHaveClass(
			"sticky",
			"top-0",
			"z-50",
			"bg-emerald-200",
			"text-gray-900",
			"shadow-sm",
		);
	});

	it("renders navigation links", () => {
		render(<Header />);
		const homeLink = screen.getByRole("link", { name: /home/i });
		const analyticsLink = screen.getByRole("link", { name: /analytics/i });

		expect(homeLink).toBeInTheDocument();
		expect(analyticsLink).toBeInTheDocument();
	});

	it("navigation links have correct hrefs", () => {
		render(<Header />);
		const homeLink = screen.getByRole("link", { name: /home/i });
		const analyticsLink = screen.getByRole("link", { name: /analytics/i });

		expect(homeLink).toHaveAttribute("href", "/");
		expect(analyticsLink).toHaveAttribute("href", "/analytics");
	});
});

describe("MainLayout", () => {
	it("renders children, header, and footer", () => {
		render(
			<MainLayout>
				<div>Page Content</div>
			</MainLayout>,
		);

		// Check children rendered
		expect(screen.getByText("Page Content")).toBeInTheDocument();

		// Check header title
		expect(screen.getByText(/Cover Craft/i)).toBeInTheDocument();

		// Check footer copyright
		expect(screen.getByText(/© \d{4}/i)).toBeInTheDocument();
	});

	it("applies correct background color", () => {
		const { container } = render(
			<MainLayout>
				<div>Content</div>
			</MainLayout>,
		);

		const mainContainer = container.firstChild as HTMLElement;
		expect(mainContainer).toHaveClass("bg-emerald-100", "text-gray-900");
	});
});

describe("GenerationPageLayout", () => {
	it("renders title, description, and children within semantic tags", () => {
		const { container } = render(
			<GenerationPageLayout
				title="Test Generator Title"
				description="Test generator description text."
				activeMode="single"
				ariaLabel="Test generation form"
			>
				<div>Form Content Here</div>
			</GenerationPageLayout>,
		);

		const article = container.querySelector("article");
		expect(article).toBeInTheDocument();
		expect(article).toHaveClass("w-full");

		const header = container.querySelector("header");
		expect(header).toBeInTheDocument();

		const titleElement = screen.getByRole("heading", {
			level: 1,
			name: "Test Generator Title",
		});
		expect(titleElement).toBeInTheDocument();

		expect(
			screen.getByText("Test generator description text."),
		).toBeInTheDocument();

		const section = screen.getByRole("region", {
			name: "Test generation form",
		});
		expect(section).toBeInTheDocument();
		expect(screen.getByText("Form Content Here")).toBeInTheDocument();
	});

	it("passes activeMode correctly to GenerationNav", () => {
		render(
			<GenerationPageLayout
				title="Carousel Title"
				description="Carousel description."
				activeMode="carousel"
				ariaLabel="Carousel generation form"
			>
				<div>Carousel Content</div>
			</GenerationPageLayout>,
		);

		const carouselLink = screen.getByRole("link", {
			name: /carousel builder/i,
		});
		expect(carouselLink).toHaveAttribute("aria-current", "page");

		const singleLink = screen.getByRole("link", {
			name: /single cover/i,
		});
		expect(singleLink).not.toHaveAttribute("aria-current");
	});
});
