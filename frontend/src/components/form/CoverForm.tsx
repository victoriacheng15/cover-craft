"use client";

import Image from "next/image";
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
  const [_generatedImage, setGeneratedImage] = useState<Blob | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null,
  );

  // Get scaled dimensions for preview (25% of actual size, but max 50% of container)
  const getPreviewDimensions = () => {
    const selectedSize = SIZE_PRESETS.find((preset) => preset.label === size);
    if (!selectedSize) return { width: 300, height: 157 };
    return {
      width: selectedSize.width * 0.5,
      height: selectedSize.height * 0.5,
    };
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      setGeneratedImageUrl(null);

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

      // Convert blob to data URL for display (more compatible than blob URL)
      const reader = new FileReader();
      reader.onload = () => {
        setGeneratedImageUrl(reader.result as string);
      };
      reader.readAsDataURL(imageBlob);
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
      <Card
        test-id="check"
        className="w-full md:min-w-[300px] flex flex-col items-center"
      >
        {!generatedImageUrl ? (
          <>
            <SectionTitle>Live Preview</SectionTitle>
            <div
              className="flex justify-center items-center rounded-md border border-gray-300 max-w-full"
              style={{
                backgroundColor,
                color: textColor,
                fontFamily: font,
                width: `min(${getPreviewDimensions().width}px, 100%)`,
                height: `auto`,
                aspectRatio: `${getPreviewDimensions().width} / ${getPreviewDimensions().height}`,
              }}
            >
              <div className="text-center px-4">
                <h1 className="text-2xl font-bold">
                  {heading || "Heading Preview"}
                </h1>
                <p className="text-lg">{subheading || "Subheading Preview"}</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <SectionTitle>Generated Image</SectionTitle>
            <div className="w-full flex justify-center items-center">
              <Image
                src={generatedImageUrl || ""}
                alt="Generated Cover"
                width={getPreviewDimensions().width}
                height={getPreviewDimensions().height}
                className="max-w-full h-auto object-contain rounded-md border border-gray-300"
                unoptimized
              />
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                onClick={async () => {
                  if (_generatedImage) {
                    try {
                      const timestamp = Math.floor(Date.now() / 1000);
                      const filename = `${imageName}-${timestamp}.png`;
                      await downloadImage(_generatedImage, filename);
                    } catch (err) {
                      setError(
                        err instanceof Error
                          ? err.message
                          : "Failed to download image",
                      );
                    }
                  }
                }}
              >
                Download
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
