import { useState } from "react";
import FormField from "./FormField";
import { Card, SectionTitle, Input, Select, ColorPicker, Button } from "@/components/ui";

const SIZE_PRESETS = [
  { label: "Post (1200 × 627)", width: 1200, height: 627 },
  { label: "Square (1080 × 1080)", width: 1080, height: 1080 },
];

const FONT_OPTIONS = ["Arial", "Roboto", "Inter", "Georgia", "Times New Roman"];

export default function CoverForm() {
  const [size, setSize] = useState(SIZE_PRESETS[0].label);
  const [imageName, setImageName] = useState("");
  const [heading, setHeading] = useState("");
  const [subheading, setSubheading] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#374151");
  const [textColor, setTextColor] = useState("#F9FAFB");
  const [font, setFont] = useState(FONT_OPTIONS[0]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    // Placeholder for API call
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 1000);
    // Replace with actual API integration later
  };

  return (
    <div className="grid md:grid-cols-5 gap-6">
      {/* Form Section */}
      <Card className="md:col-span-2 space-y-4">
        <SectionTitle>Cover Details</SectionTitle>

        <FormField label="Size Preset" htmlFor="size-preset">
          <Select id="size-preset" value={size} onChange={(e) => setSize(e.target.value)}>
            {SIZE_PRESETS.map((preset) => (
              <option key={preset.label} value={preset.label}>
                {preset.label}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Image Name" description="Filename for your cover image" htmlFor="image-name">
          <Input
            id="image-name"
            placeholder="my-awesome-cover"
            value={imageName}
            onChange={(e) => setImageName(e.target.value)}
          />
        </FormField>

        <FormField label="Heading" description="Main cover title" htmlFor="heading">
          <Input
            id="heading"
            placeholder="Enter your cover title..."
            value={heading}
            onChange={(e) => setHeading(e.target.value)}
          />
        </FormField>

        <FormField label="Subheading" description="Subtitle or author name" htmlFor="subheading">
          <Input
            id="subheading"
            placeholder="Subtitle or author name..."
            value={subheading}
            onChange={(e) => setSubheading(e.target.value)}
          />
        </FormField>

        <FormField label="Background Color" htmlFor="background-color">
          <ColorPicker
            id="background-color"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
          />
        </FormField>

        <FormField label="Text Color" htmlFor="text-color">
          <ColorPicker id="text-color" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
        </FormField>

        <FormField label="Font" htmlFor="font">
          <Select id="font" value={font} onChange={(e) => setFont(e.target.value)}>
            {FONT_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </Select>
        </FormField>

        <Button
          onClick={handleGenerate}
          disabled={!heading || !imageName || isGenerating}
        >
          {isGenerating ? "Generating..." : "Generate"}
        </Button>
      </Card>

      {/* Preview Section */}
      <Card className="md:col-span-3 h-[400px] flex flex-col justify-center items-center">
        <SectionTitle>Live Preview</SectionTitle>
        <div
          className="w-full h-full flex justify-center items-center rounded-md border border-gray-300"
          style={{
            backgroundColor,
            color: textColor,
            fontFamily: font,
          }}
        >
          <div className="text-center">
            <h1 className="text-2xl font-bold">{heading || "Heading Preview"}</h1>
            <p className="text-lg">{subheading || "Subheading Preview"}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
