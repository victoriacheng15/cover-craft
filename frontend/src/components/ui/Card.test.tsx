import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Card from "./Card";

describe("Card", () => {
	it("renders children correctly", () => {
		render(
			<Card>
				<p>Card content</p>
			</Card>,
		);

		expect(screen.getByText("Card content")).toBeInTheDocument();
	});

	it("applies additional className", () => {
		render(
			<Card className="custom-class">
				<p>Styled card</p>
			</Card>,
		);

		const cardElement = screen.getByText("Styled card").parentElement;
		expect(cardElement).toHaveClass("custom-class");
	});
});
