import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Skeleton from "./Skeleton";

describe("Skeleton", () => {
	it("renders correctly with default styles", () => {
		const { container } = render(<Skeleton />);
		const skeleton = container.firstChild as HTMLElement;
		expect(skeleton).toHaveClass("animate-pulse");
		expect(skeleton).toHaveClass("bg-gray-200");
		expect(skeleton).toHaveClass("rounded-md");
	});

	it("applies custom className", () => {
		const { container } = render(<Skeleton className="h-4 w-full" />);
		const skeleton = container.firstChild as HTMLElement;
		expect(skeleton).toHaveClass("h-4");
		expect(skeleton).toHaveClass("w-full");
	});

	it("passes through extra props", () => {
		const { container } = render(<Skeleton data-testid="skeleton-test" />);
		const skeleton = container.firstChild as HTMLElement;
		expect(skeleton).toHaveAttribute("data-testid", "skeleton-test");
	});
});
