import { useState } from "react";
import {
  downloadImage,
  generateCoverImage,
  sendDownloadMetric,
  sendGenericMetric,
} from "@/lib";

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

export function useForm() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<Blob | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null,
  );

  const handleInputChange = (key: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

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
      const selectedSize = SIZE_PRESETS.find(
        (preset) => preset.label === formData.size,
      );
      if (!selectedSize) throw new Error("Invalid size selected");
      sendGenericMetric("generate_click", formData.size, formData.font);
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
      const reader = new FileReader();
      reader.onload = () => setGeneratedImageUrl(reader.result as string);
      reader.readAsDataURL(imageBlob);
      setFormData(initialFormData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate image");
      console.error("Error generating image:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    try {
      sendDownloadMetric();
      const timestamp = Math.floor(Date.now() / 1000);
      const downloadFilename = `${formData.filename || "cover"}-${timestamp}.png`;
      await downloadImage(generatedImage, downloadFilename);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download image");
    }
  };

  return {
    formData,
    isGenerating,
    error,
    generatedImageUrl,
    handleInputChange,
    getPreviewDimensions,
    handleGenerate,
    handleDownload,
  };
}

export { SIZE_PRESETS, FONT_OPTIONS, initialFormData };
