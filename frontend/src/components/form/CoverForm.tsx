"use client";

import {
  Lato,
  Montserrat,
  Open_Sans,
  Playfair_Display,
  Roboto,
} from "next/font/google";
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

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const SIZE_PRESETS = [
  { label: "Post (1200 × 627)", width: 1200, height: 627 },
  { label: "Square (1080 × 1080)", width: 1080, height: 1080 },
];

const FONT_OPTIONS = [
  "Montserrat",
  "Roboto",
  "Lato",
  "Playfair Display",
  "Open Sans",
];

const fontFamilyMap: Record<string, string> = {
  Montserrat: "var(--font-montserrat)",
  Roboto: "var(--font-roboto)",
  Lato: "var(--font-lato)",
  "Playfair Display": "var(--font-playfair-display)",
  "Open Sans": "var(--font-open-sans)",
};

interface FormData {
  size: string;
  filename: string;
  title: string;
  subtitle?: string;
  backgroundColor: string;
  textColor: string;
  font: string;
}

const initialFormData: FormData = {
  size: SIZE_PRESETS[0].label,
  filename: "",
  title: "",
  subtitle: "",
  backgroundColor: "#374151",
  textColor: "#F9FAFB",
  font: FONT_OPTIONS[0],
};

export default function CoverForm() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [_generatedImage, setGeneratedImage] = useState<Blob | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null,
  );
  const errorId = "form-error-message";

  const handleInputChange = (key: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Get scaled dimensions for preview (50% of actual size for display)
  const getPreviewDimensions = () => {
    const selectedSize = SIZE_PRESETS.find(
      (preset) => preset.label === formData.size,
    );
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
      const selectedSize = SIZE_PRESETS.find(
        (preset) => preset.label === formData.size,
      );
      if (!selectedSize) {
        throw new Error("Invalid size selected");
      }

      // Call API to generate cover image
      const imageBlob = await generateCoverImage({
        width: selectedSize.width,
        height: selectedSize.height,
        backgroundColor: formData.backgroundColor,
        textColor: formData.textColor,
        font: formData.font,
        title: formData.title,
        subtitle: formData.subtitle,
        filename: formData.filename || "cover",
      });

      setGeneratedImage(imageBlob);

      // Convert blob to data URL for display (more compatible than blob URL)
      const reader = new FileReader();
      reader.onload = () => {
        setGeneratedImageUrl(reader.result as string);
      };
      reader.readAsDataURL(imageBlob);

      // Reset form after successful generation
      setFormData(initialFormData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate image");
      console.error("Error generating image:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      className={`w-full flex flex-col md:flex-row gap-6 ${montserrat.variable} ${roboto.variable} ${lato.variable} ${playfairDisplay.variable} ${openSans.variable}`}
    >
      {/* Form Section */}
      <Card className="min-w-[50%] flex-1 flex flex-col gap-4" role="region" aria-label="Cover image generator form">
        <SectionTitle>Cover Details</SectionTitle>

        <FormField label="Size Preset" htmlFor="size-preset">
          <Select
            id="size-preset"
            value={formData.size}
            onChange={(e) => handleInputChange("size", e.target.value)}
            aria-label="Select cover image size preset"
          >
            {SIZE_PRESETS.map((preset) => (
              <option key={preset.label} value={preset.label}>
                {preset.label}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Filename" htmlFor="filename">
          <Input
            id="filename"
            placeholder="my-awesome-cover"
            value={formData.filename}
            onChange={(e) => handleInputChange("filename", e.target.value)}
            aria-label="Enter filename for your cover image (optional)"
          />
        </FormField>

        <FormField label="Title" htmlFor="title" required>
          <Input
            id="title"
            placeholder="Enter your cover title..."
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            aria-label="Enter your cover title (required)"
            aria-describedby={error ? errorId : undefined}
          />
        </FormField>

        <FormField label="Subtitle" htmlFor="subtitle">
          <Input
            id="subtitle"
            placeholder="Subtitle"
            value={formData.subtitle}
            onChange={(e) => handleInputChange("subtitle", e.target.value)}
            aria-label="Enter your cover subtitle (optional)"
          />
        </FormField>

        <div className="flex gap-4">
          <div className="flex-1">
            <FormField label="Background Color" htmlFor="background-color">
              <ColorPicker
                id="background-color"
                value={formData.backgroundColor}
                onChange={(e) =>
                  handleInputChange("backgroundColor", e.target.value)
                }
                title="Choose background color for your cover"
                aria-label="Background color picker"
              />
            </FormField>
          </div>

          <div className="flex-1">
            <FormField label="Text Color" htmlFor="text-color">
              <ColorPicker
                id="text-color"
                value={formData.textColor}
                onChange={(e) => handleInputChange("textColor", e.target.value)}
                title="Choose text color for your cover"
                aria-label="Text color picker"
              />
            </FormField>
          </div>
        </div>

        <FormField label="Font" htmlFor="font">
          <Select
            id="font"
            value={formData.font}
            onChange={(e) => handleInputChange("font", e.target.value)}
            aria-label="Select font for your cover text"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </Select>
        </FormField>

        {error && (
          <div
            className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md"
            role="alert"
            id={errorId}
            aria-live="polite"
          >
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="flex justify-center">
          <Button
            onClick={handleGenerate}
            disabled={!formData.title || isGenerating}
            isLoading={isGenerating}
            aria-label={isGenerating ? "Generating your cover image" : "Generate cover image"}
          >
            {isGenerating ? "Generating..." : "Generate"}
          </Button>
        </div>
      </Card>

      {/* Preview Section */}
      <Card
        className="w-full md:min-w-[300px] flex flex-col items-center"
        role="region"
        aria-label={generatedImageUrl ? "Generated cover image" : "Live preview of cover image"}
        aria-live="polite"
      >
        {!generatedImageUrl ? (
          <>
            <SectionTitle>Live Preview</SectionTitle>
            <div
              className="flex justify-center items-center rounded-md border border-gray-300 max-w-full"
              style={{
                backgroundColor: formData.backgroundColor,
                color: formData.textColor,
                fontFamily: fontFamilyMap[formData.font],
                width: `min(${getPreviewDimensions().width}px, 100%)`,
                height: `auto`,
                aspectRatio: `${getPreviewDimensions().width} / ${getPreviewDimensions().height}`,
              }}
              role="img"
              aria-label={`Preview: ${formData.title || "Title"} - ${formData.subtitle || "Subtitle"}`}
            >
              <div className="text-center px-4">
                <h2 className="text-2xl" style={{ fontWeight: 700 }}>
                  {formData.title || "Title Preview"}
                </h2>
                <p className="text-lg" style={{ fontWeight: 400 }}>
                  {formData.subtitle || "Subtitle Preview"}
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            <SectionTitle>Generated Image</SectionTitle>
            <div className="w-full flex justify-center items-center">
              <Image
                src={generatedImageUrl || ""}
                alt={`Generated cover image: ${formData.title}`}
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
                      const downloadFilename = `${formData.filename || "cover"}-${timestamp}.png`;
                      await downloadImage(_generatedImage, downloadFilename);
                    } catch (err) {
                      setError(
                        err instanceof Error
                          ? err.message
                          : "Failed to download image",
                      );
                    }
                  }
                }}
                aria-label={`Download generated cover image as ${formData.filename || "cover"}.png`}
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
