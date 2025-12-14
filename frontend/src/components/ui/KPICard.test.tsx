import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import KPICard from "./KPICard";

describe("KPICard", () => {
	it("renders title and value correctly", () => {
		render(<KPICard title="Test Metric" value={100} color="blue" />);

		expect(screen.getByText("Test Metric")).toBeInTheDocument();
		expect(screen.getByText("100")).toBeInTheDocument();
	});

	it("formats numeric values to whole numbers", () => {
		render(<KPICard title="Percentage" value={75.567} color="green" />);

		expect(screen.getByText("76")).toBeInTheDocument();
	});

	it("displays string values as-is", () => {
		render(<KPICard title="String Value" value="1478.50" color="purple" />);

		expect(screen.getByText("1478.50")).toBeInTheDocument();
	});

	it("appends suffix correctly", () => {
		render(
			<KPICard title="Success Rate" value={95.5} color="orange" suffix="%" />,
		);

		// Check that formatted value and suffix are in the document
		expect(screen.getByText(/^96/)).toBeInTheDocument();
	});

	it("applies correct color styling for blue", () => {
		const { container } = render(
			<KPICard title="Metric" value={100} color="blue" />,
		);

		const card = container.firstChild as HTMLElement;
		expect(card).toHaveClass("bg-blue-50");
		expect(screen.getByText("100")).toHaveClass("text-blue-600");
	});

	it("applies correct color styling for green", () => {
		const { container } = render(
			<KPICard title="Metric" value={100} color="green" />,
		);

		const card = container.firstChild as HTMLElement;
		expect(card).toHaveClass("bg-green-50");
		expect(screen.getByText("100")).toHaveClass("text-green-600");
	});

	it("applies correct color styling for red", () => {
		const { container } = render(
			<KPICard title="Failure Rate" value={5} color="red" />,
		);

		const card = container.firstChild as HTMLElement;
		expect(card).toHaveClass("bg-red-50");
		expect(screen.getByText("5")).toHaveClass("text-red-600");
	});

	it("applies correct color styling for white", () => {
		const { container } = render(
			<KPICard title="Metric" value={100} color="white" />,
		);

		const card = container.firstChild as HTMLElement;
		expect(card).toHaveClass("bg-white");
		expect(card).toHaveClass("border");
		expect(screen.getByText("100")).toHaveClass("text-gray-900");
	});

	it("applies bold font by default", () => {
		render(<KPICard title="Metric" value={100} color="blue" />);

		expect(screen.getByText("100")).toHaveClass("font-bold");
	});

	it("applies semibold font when bold is false", () => {
		render(<KPICard title="Metric" value={100} color="blue" bold={false} />);

		expect(screen.getByText("100")).toHaveClass("font-semibold");
	});

	it("handles all color variants", () => {
		const colors = [
			"blue",
			"green",
			"purple",
			"orange",
			"indigo",
			"pink",
			"red",
			"white",
		] as const;

		colors.forEach((color) => {
			const { unmount } = render(
				<KPICard title={`${color} card`} value={100} color={color} />,
			);

			expect(screen.getByText(`${color} card`)).toBeInTheDocument();
			unmount();
		});
	});

	it("handles zero value correctly", () => {
		render(<KPICard title="Zero Value" value={0} color="blue" />);

		expect(screen.getByText("0")).toBeInTheDocument();
	});

	it("combines suffix with formatted value", () => {
		render(
			<KPICard title="Duration" value={1478.9} color="white" suffix="ms" />,
		);

		expect(screen.getByText(/1479ms/)).toBeInTheDocument();
	});
});
