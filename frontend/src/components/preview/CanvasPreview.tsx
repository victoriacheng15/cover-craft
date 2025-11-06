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
      <div className="text-center px-4">
        <h1 className="text-4xl" style={{ fontWeight: 700 }}>
          {heading || "Heading Preview"}
        </h1>
        <p className="text-2xl mt-2" style={{ fontWeight: 400 }}>
          {subheading || "Subheading Preview"}
        </p>
      </div>
    </div>
  );
}
