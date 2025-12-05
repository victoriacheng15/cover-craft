import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { downloadImage, generateCoverImage, health } from "./api";

// Mock fetch globally
global.fetch = vi.fn();

describe("API functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("health", () => {
    it("calls the health check endpoint and returns response", async () => {
      const mockResponse = { status: "ok" };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await health();

      expect(global.fetch).toHaveBeenCalledWith("/api/health");
      expect(result).toEqual(mockResponse);
    });

    it("throws error when health check fails", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: "Internal Server Error",
      });

      await expect(health()).rejects.toThrow(
        "Health check failed: Internal Server Error",
      );
    });
  });

  describe("generateCoverImage", () => {
    it("sends correct request with image parameters", async () => {
      const mockBlob = new Blob(["test"], { type: "image/png" });
      const params = {
        width: 1200,
        height: 627,
        backgroundColor: "#374151",
        textColor: "#f9fafb",
        font: "Montserrat",
        title: "Test Title",
        subtitle: "Test Subtitle",
        filename: "test-file",
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
      });

      const result = await generateCoverImage(params);

      expect(global.fetch).toHaveBeenCalledWith("/api/generateCoverImage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });
      expect(result).toEqual(mockBlob);
    });

    it("throws error with custom error message from response", async () => {
      const params = {
        width: 1200,
        height: 627,
        backgroundColor: "#374151",
        textColor: "#f9fafb",
        font: "Montserrat",
        title: "Test Title",
        subtitle: undefined,
        filename: "test",
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Invalid parameters" }),
      });

      await expect(generateCoverImage(params)).rejects.toThrow(
        "Invalid parameters",
      );
    });

    it("throws generic error when no error message in response", async () => {
      const params = {
        width: 1200,
        height: 627,
        backgroundColor: "#374151",
        textColor: "#f9fafb",
        font: "Montserrat",
        title: "Test Title",
        subtitle: undefined,
        filename: "test",
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(generateCoverImage(params)).rejects.toThrow(
        "Failed to generate cover image",
      );
    });
  });

  describe("downloadImage", () => {
    let mockLink: HTMLAnchorElement;
    let originalShowSaveFilePicker: any;

    beforeEach(() => {
      // Save original showSaveFilePicker
      originalShowSaveFilePicker = (window as any).showSaveFilePicker;

      // Mock document methods
      mockLink = document.createElement("a");
      vi.spyOn(document, "createElement").mockReturnValue(mockLink as any);
      vi.spyOn(document.body, "appendChild");
      vi.spyOn(document.body, "removeChild");
      vi.spyOn(mockLink, "click");
    });

    afterEach(() => {
      // Restore original
      if (originalShowSaveFilePicker) {
        (window as any).showSaveFilePicker = originalShowSaveFilePicker;
      } else {
        delete (window as any).showSaveFilePicker;
      }
      vi.restoreAllMocks();
    });

    it("downloads image using legacy method when File System API not available", async () => {
      const blob = new Blob(["test"], { type: "image/png" });
      const filename = "test-image.png";

      // Ensure showSaveFilePicker is not available
      delete (window as any).showSaveFilePicker;

      // Mock FileReader with synchronous onload callback
      global.FileReader = class {
        onload: (() => void) | null = null;
        result = "data:image/png;base64,test";
        readAsDataURL = vi.fn(function (this: any) {
          // Call onload synchronously
          this.onload?.();
        });
      } as any;

      await downloadImage(blob, filename);

      expect(mockLink.download).toBe(filename);
      expect(mockLink.click).toHaveBeenCalled();
    });

    it("uses File System API when available and successfully saves file", async () => {
      const blob = new Blob(["test"], { type: "image/png" });
      const filename = "test-image.png";

      const mockWritable = {
        write: vi.fn().mockResolvedValueOnce(undefined),
        close: vi.fn().mockResolvedValueOnce(undefined),
      };

      const mockHandle = {
        createWritable: vi.fn().mockResolvedValueOnce(mockWritable),
      };

      const mockShowSaveFilePicker = vi.fn().mockResolvedValueOnce(mockHandle);

      (window as any).showSaveFilePicker = mockShowSaveFilePicker;

      await downloadImage(blob, filename);

      expect(mockShowSaveFilePicker).toHaveBeenCalledWith({
        suggestedName: filename,
        types: [
          {
            description: "PNG Image",
            accept: { "image/png": [".png"] },
          },
        ],
      });
      expect(mockHandle.createWritable).toHaveBeenCalled();
      expect(mockWritable.write).toHaveBeenCalledWith(blob);
      expect(mockWritable.close).toHaveBeenCalled();
    });

    it("silently handles AbortError from File System API", async () => {
      const blob = new Blob(["test"], { type: "image/png" });
      const filename = "test-image.png";

      const abortError = new Error("User cancelled");
      abortError.name = "AbortError";

      // Mock window with showSaveFilePicker
      (window as any).showSaveFilePicker = vi
        .fn()
        .mockRejectedValueOnce(abortError);

      // Should not throw
      await expect(downloadImage(blob, filename)).resolves.toBeUndefined();
    });

    it("throws error when File System API fails", async () => {
      const blob = new Blob(["test"], { type: "image/png" });
      const filename = "test-image.png";

      // Mock window with showSaveFilePicker
      (window as any).showSaveFilePicker = vi
        .fn()
        .mockRejectedValueOnce(new Error("Permission denied"));

      await expect(downloadImage(blob, filename)).rejects.toThrow(
        "Failed to save file: Permission denied",
      );
    });
  });
});
