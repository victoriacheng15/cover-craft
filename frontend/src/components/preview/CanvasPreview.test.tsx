import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CanvasPreview from "./CanvasPreview";

describe("CanvasPreview", () => {
  it("renders heading and subheading correctly", () => {
    render(
      <CanvasPreview
        heading="Test Heading"
        subheading="Test Subheading"
        backgroundColor="#ffffff"
        textColor="#000000"
        font="Arial"
      />
    );

    expect(screen.getByText("Test Heading")).toBeInTheDocument();
    expect(screen.getByText("Test Subheading")).toBeInTheDocument();
  });

  it("uses default heading and subheading when props are empty", () => {
    render(
      <CanvasPreview
        heading=""
        subheading=""
        backgroundColor="#ffffff"
        textColor="#000000"
        font="Arial"
      />
    );

    expect(screen.getByText("Heading Preview")).toBeInTheDocument();
    expect(screen.getByText("Subheading Preview")).toBeInTheDocument();
  });

  it("applies styles correctly", () => {
    const { container } = render(
      <CanvasPreview
        heading="Style Test"
        subheading="Check Colors"
        backgroundColor="#123456"
        textColor="#abcdef"
        font="Roboto"
        width={800}
        height={400}
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({
      backgroundColor: "#123456",
      color: "#abcdef",
      fontFamily: "Roboto",
      width: "800px",
      height: "400px",
    });
  });

  it("defaults width and height if not provided", () => {
    const { container } = render(
      <CanvasPreview
        heading="Default Size"
        subheading="Check Defaults"
        backgroundColor="#000000"
        textColor="#ffffff"
        font="Arial"
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({
      width: "1200px",
      height: "627px",
    });
  });
});
