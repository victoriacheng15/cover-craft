import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MainLayout from "./MainLayout";

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
		expect(screen.getByText(/© 2025/i)).toBeInTheDocument();
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
