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

  it("includes default Tailwind classes", () => {
    render(<Card>Default card</Card>);

    const cardElement = screen.getByText("Default card").closest("div");

    expect(cardElement).toHaveClass("rounded-xl");
    expect(cardElement).toHaveClass("border");
    expect(cardElement).toHaveClass("bg-card");
    expect(cardElement).toHaveClass("p-4");
    expect(cardElement).toHaveClass("shadow-sm");
    expect(cardElement).toHaveClass("dark:bg-gray-800");
    expect(cardElement).toHaveClass("dark:border-gray-700");
  });
});
