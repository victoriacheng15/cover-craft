interface CanvasPreviewProps {
  heading: string;
  subheading: string;
  backgroundColor: string;
  textColor: string;
  font: string;
  width?: number;
  height?: number;
}

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
        fontFamily: font,
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      <div className="text-center px-4">
        <h1 className="text-4xl font-bold">{heading || "Heading Preview"}</h1>
        <p className="text-2xl mt-2">{subheading || "Subheading Preview"}</p>
      </div>
    </div>
  );
}
