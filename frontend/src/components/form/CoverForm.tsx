"use client";

import { useState } from "react";
import {
  Button,
  Card,
  ColorPicker,
  Input,
  SectionTitle,
  Select,
} from "@/components/ui";
import { downloadImage, generateCoverImage } from "@/lib";
import FormField from "./FormField";

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
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<Blob | null>(null);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      // Get selected size dimensions
      const selectedSize = SIZE_PRESETS.find((preset) => preset.label === size);
      if (!selectedSize) {
        throw new Error("Invalid size selected");
      }

      // Call API to generate cover image
      const imageBlob = await generateCoverImage({
        width: selectedSize.width,
        height: selectedSize.height,
        backgroundColor,
        textColor,
        font,
        heading,
        subheading,
        imageName,
      });

      setGeneratedImage(imageBlob);

      // Automatically download the image
      const timestamp = Math.floor(Date.now() / 1000);
      const filename = `${imageName}-${timestamp}.png`;
      downloadImage(imageBlob, filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate image");
      console.error("Error generating image:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full flex flex-col md:flex-row gap-6">
      {/* Form Section */}
      <Card className="min-w-[50%] flex-1 flex flex-col gap-4">
        <SectionTitle>Cover Details</SectionTitle>

        <FormField label="Size Preset" htmlFor="size-preset">
          <Select
            id="size-preset"
            value={size}
            onChange={(e) => setSize(e.target.value)}
          >
            {SIZE_PRESETS.map((preset) => (
              <option key={preset.label} value={preset.label}>
                {preset.label}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          label="Image Name"
          description="Filename for your cover image"
          htmlFor="image-name"
        >
          <Input
            id="image-name"
            placeholder="my-awesome-cover"
            value={imageName}
            onChange={(e) => setImageName(e.target.value)}
          />
        </FormField>

        <FormField
          label="Title"
          description="Main cover title"
          htmlFor="heading"
        >
          <Input
            id="heading"
            placeholder="Enter your cover title..."
            value={heading}
            onChange={(e) => setHeading(e.target.value)}
          />
        </FormField>

        <FormField label="Subtitle" description="Subtitle" htmlFor="subheading">
          <Input
            id="subheading"
            placeholder="Subtitle"
            value={subheading}
            onChange={(e) => setSubheading(e.target.value)}
          />
        </FormField>

        <div className="flex gap-4">
          <div className="flex-1">
            <FormField label="Background Color" htmlFor="background-color">
              <ColorPicker
                id="background-color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
              />
            </FormField>
          </div>

          <div className="flex-1">
            <FormField label="Text Color" htmlFor="text-color">
              <ColorPicker
                id="text-color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
              />
            </FormField>
          </div>
        </div>

        <FormField label="Font" htmlFor="font">
          <Select
            id="font"
            value={font}
            onChange={(e) => setFont(e.target.value)}
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </Select>
        </FormField>

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="flex justify-center">
          <Button
            onClick={handleGenerate}
            disabled={!heading || !imageName || isGenerating}
          >
            {isGenerating ? "Generating..." : "Generate"}
          </Button>
        </div>
      </Card>

      {/* Preview Section */}
      <Card className="w-full md:flex-1 min-h-[400px] h-[400px] flex flex-col justify-center items-center">
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
            <h1 className="text-2xl font-bold">
              {heading || "Heading Preview"}
            </h1>
            <p className="text-lg">{subheading || "Subheading Preview"}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
