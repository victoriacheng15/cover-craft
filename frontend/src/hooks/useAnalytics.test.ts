import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { useAnalytics } from "./useAnalytics";

// Mock fetch globally
global.fetch = vi.fn();

describe("useAnalytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes with loading state", () => {
    (global.fetch as any).mockImplementation(
      () =>
        new Promise(() => {
          /* never resolves */
        }),
    );

    const { result } = renderHook(() => useAnalytics());

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it("fetches analytics data successfully", async () => {
    const mockData = {
      eventCounts: [{ _id: "generate_click", count: 100 }],
      generateClickCount: 100,
      downloadClickCount: 50,
      generateClicksPerMonth: [
        { _id: { year: 2025, month: 11 }, count: 80 },
      ],
      downloadClicksPerMonth: [
        { _id: { year: 2025, month: 11 }, count: 40 },
      ],
      generateByFont: [{ _id: "Montserrat", count: 60 }],
      generateBySize: [{ _id: "Post (1200 × 627)", count: 100 }],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useAnalytics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBe(null);
  });

  it("handles fetch errors", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
    });

    const { result } = renderHook(() => useAnalytics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Failed to fetch analytics");
    expect(result.current.data).toBe(null);
  });

  it("returns correct COLORS array", async () => {
    const mockData = {
      eventCounts: [],
      generateClickCount: 0,
      downloadClickCount: 0,
      generateClicksPerMonth: [],
      downloadClicksPerMonth: [],
      generateByFont: [],
      generateBySize: [],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useAnalytics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.COLORS).toEqual([
      "#34d399",
      "#60a5fa",
      "#fbbf24",
      "#f87171",
      "#a78bfa",
      "#f472b6",
      "#38bdf8",
      "#facc15",
    ]);
  });

  it("calculates total clicks data correctly", async () => {
    const mockData = {
      eventCounts: [],
      generateClickCount: 100,
      downloadClickCount: 50,
      generateClicksPerMonth: [],
      downloadClicksPerMonth: [],
      generateByFont: [],
      generateBySize: [],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useAnalytics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.totalClicksData).toEqual([
      { name: "Total", value: 150 },
      { name: "Generate", value: 100 },
      { name: "Download", value: 50 },
    ]);
  });

  it("handles zero click counts", async () => {
    const mockData = {
      eventCounts: [],
      generateClickCount: 0,
      downloadClickCount: 0,
      generateClicksPerMonth: [],
      downloadClicksPerMonth: [],
      generateByFont: [],
      generateBySize: [],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useAnalytics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.totalClicksData).toEqual([
      { name: "Total", value: 0 },
      { name: "Generate", value: 0 },
      { name: "Download", value: 0 },
    ]);
  });

  it("generates monthly line data for last 12 months", async () => {
    const mockData = {
      eventCounts: [],
      generateClickCount: 100,
      downloadClickCount: 50,
      generateClicksPerMonth: [
        { _id: { year: 2025, month: 11 }, count: 80 },
      ],
      downloadClicksPerMonth: [
        { _id: { year: 2025, month: 11 }, count: 40 },
      ],
      generateByFont: [],
      generateBySize: [],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useAnalytics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should have exactly 12 months of data
    expect(result.current.monthlyLineData).toHaveLength(12);

    // Each month should have the correct structure
    result.current.monthlyLineData.forEach((month) => {
      expect(month).toHaveProperty("month");
      expect(month).toHaveProperty("Generate");
      expect(month).toHaveProperty("Download");
      expect(typeof month.Generate).toBe("number");
      expect(typeof month.Download).toBe("number");
    });
  });

  it("fills missing months with zero values in monthly data", async () => {
    const mockData = {
      eventCounts: [],
      generateClickCount: 0,
      downloadClickCount: 0,
      generateClicksPerMonth: [], // No data for any month
      downloadClicksPerMonth: [],
      generateByFont: [],
      generateBySize: [],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useAnalytics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // All months should have 0 for both Generate and Download
    result.current.monthlyLineData.forEach((month) => {
      expect(month.Generate).toBe(0);
      expect(month.Download).toBe(0);
    });
  });

  // it("returns null data and sets error when no data in response", async () => {
  //   (global.fetch as any).mockResolvedValueOnce({
  //     ok: true,
  //     json: async () => ({}),
  //   });

  //   const { result } = renderHook(() => useAnalytics());

  //   await waitFor(() => {
  //     expect(result.current.loading).toBe(false);
  //   });

  //   expect(result.current.data).toEqual({});
  //   expect(result.current.error).toBe(null);
  // });

  it("handles partial monthly data", async () => {
    const mockData = {
      eventCounts: [],
      generateClickCount: 100,
      downloadClickCount: 50,
      generateClicksPerMonth: [
        { _id: { year: 2025, month: 11 }, count: 80 },
        { _id: { year: 2025, month: 10 }, count: 20 },
      ],
      downloadClicksPerMonth: [
        { _id: { year: 2025, month: 11 }, count: 40 },
      ],
      generateByFont: [],
      generateBySize: [],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useAnalytics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Check that the hook correctly handles data from different months
    const monthlyData = result.current.monthlyLineData;
    expect(monthlyData).toHaveLength(12);

    // November should have both generate and download
    const november = monthlyData.find((m) => m.month.includes("Nov"));
    expect(november).toBeDefined();
    expect(november?.Generate).toBe(80);
    expect(november?.Download).toBe(40);

    // October should have generate but no download
    const october = monthlyData.find((m) => m.month.includes("Oct"));
    expect(october).toBeDefined();
    expect(october?.Generate).toBe(20);
    expect(october?.Download).toBe(0);
  });

  it("calls fetch on component mount", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        eventCounts: [],
        generateClickCount: 0,
        downloadClickCount: 0,
        generateClicksPerMonth: [],
        downloadClicksPerMonth: [],
        generateByFont: [],
        generateBySize: [],
      }),
    });

    renderHook(() => useAnalytics());

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/analytics");
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("handles fetch network error", async () => {
    const networkError = new Error("Network error");
    (global.fetch as any).mockRejectedValueOnce(networkError);

    const { result } = renderHook(() => useAnalytics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Network error");
    expect(result.current.data).toBe(null);
  });

  it("handles non-Error thrown values", async () => {
    (global.fetch as any).mockRejectedValueOnce("String error thrown");

    const { result } = renderHook(() => useAnalytics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Unknown error");
    expect(result.current.data).toBe(null);
  });

  it("calls fetch on component mount", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        eventCounts: [],
        generateClickCount: 0,
        downloadClickCount: 0,
        generateClicksPerMonth: [],
        downloadClicksPerMonth: [],
        generateByFont: [],
        generateBySize: [],
      }),
    });

    renderHook(() => useAnalytics());

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/analytics");
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
