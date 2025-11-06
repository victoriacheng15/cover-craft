import type { HealthCheckResponse, ImageParams } from "./types";

// Use Next.js API routes for frontend requests
const HEALTH_CHECK_URL = "/api/healthCheck";
const GENERATE_COVER_IMAGE_URL = "/api/generateCoverImage";

/**
 * Health check endpoint
 */
export async function healthCheck(): Promise<HealthCheckResponse> {
  const response = await fetch(HEALTH_CHECK_URL);
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Generate cover image
 */
export async function generateCoverImage(params: ImageParams): Promise<Blob> {
  const response = await fetch(GENERATE_COVER_IMAGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to generate cover image");
  }
  return response.blob();
}

/**
 * Download the generated image using FileReader (more compatible)
 */
export function downloadImage(blob: Blob, filename: string) {
  const reader = new FileReader();
  reader.onload = () => {
    const link = document.createElement("a");
    link.style.display = "none";
    link.href = reader.result as string;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  reader.readAsDataURL(blob);
}
