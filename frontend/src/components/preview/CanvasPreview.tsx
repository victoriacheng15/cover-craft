interface CanvasPreviewProps {
  heading: string;
  subheading: string;
  backgroundColor: string;
  textColor: string;
  font: string;
  width?: number;
  height?: number;
}

const fontFamilyMap: Record<string, string> = {
  Montserrat: "var(--font-montserrat)",
  Roboto: "var(--font-roboto)",
  Lato: "var(--font-lato)",
  "Playfair Display": "var(--font-playfair-display)",
  "Open Sans": "var(--font-open-sans)",
};

export default function CanvasPreview({
  heading,
  subheading,
  backgroundColor,
  textColor,
  font,
  width = 1200,
  height = 627,
}: CanvasPreviewProps) {
  // Calculate font sizes based on canvas height for responsiveness
  // Solution #2: 9% heading (min 32px) and 7% subheading (min 24px) for better readability
  const headingFontSize = Math.max(32, Math.round(height * 0.09)); // 9% of height
  const subheadingFontSize = Math.max(24, Math.round(height * 0.07)); // 7% of height
  const lineSpacing = headingFontSize * 1.2; // Space between heading and subheading

  return (
    <div
      className="w-full h-full flex justify-center items-center border border-gray-300"
      style={{
        backgroundColor,
        color: textColor,
        fontFamily: fontFamilyMap[font],
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      <div className="text-center px-10">
        <h1 style={{ fontWeight: 700, fontSize: `${headingFontSize}px` }}>
          {heading || "Heading Preview"}
        </h1>
        <p
          style={{
            fontWeight: 400,
            fontSize: `${subheadingFontSize}px`,
            marginTop: `${lineSpacing / 2}px`,
          }}
        >
          {subheading || "Subheading Preview"}
        </p>
      </div>
    </div>
  );
}
