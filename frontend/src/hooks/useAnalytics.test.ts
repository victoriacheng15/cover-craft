import { renderHook, waitFor } from "@testing-library/react";
import type { MockedFunction } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAnalytics } from "./useAnalytics";

const fetchMock: MockedFunction<typeof fetch> = vi.fn();
global.fetch = fetchMock;

describe("useAnalytics", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("initializes with loading state", () => {
		fetchMock.mockImplementation(
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
			userEngagement: {
				totalCoversGenerated: 10,
				totalDownloads: 5,
				successRate: 50,
				dailyTrend: [
					{ date: "2025-12-01", count: 2 },
					{ date: "2025-12-02", count: 3 },
				],
			},
			featurePopularity: {
				topFonts: [{ font: "Montserrat", count: 6 }],
				topSizes: [{ size: "1200x630", count: 4 }],
				titleLengthStats: {
					avgTitleLength: 20,
					minTitleLength: 10,
					maxTitleLength: 30,
				},
				subtitleUsagePercent: 60,
			},
			accessibilityCompliance: {
				wcagDistribution: [{ level: "AAA", count: 8 }],
				contrastStats: {
					avgContrastRatio: 7.5,
					minContrastRatio: 6.0,
					maxContrastRatio: 8.0,
				},
				wcagFailurePercent: 10,
				wcagTrend: [
					{ date: "2025-12-01", AAA: 2, AA: 0, FAIL: 0 },
					{ date: "2025-12-02", AAA: 3, AA: 0, FAIL: 0 },
				],
			},
		};

		// @ts-expect-error
		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ success: true, data: mockData }),
		});

		const { result } = renderHook(() => useAnalytics());

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		expect(result.current.data).toEqual(mockData);
		expect(result.current.error).toBe(null);
	});

	it("handles fetch errors", async () => {
		// @ts-expect-error
		fetchMock.mockResolvedValueOnce({
			ok: false,
			statusText: "Internal Server Error",
		});

		const { result } = renderHook(() => useAnalytics());

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		expect(result.current.error).toBe(
			"Failed to fetch analytics: Internal Server Error",
		);
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

		// @ts-expect-error
		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => mockData,
		});

		const { result } = renderHook(() => useAnalytics());

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		expect(result.current.COLORS).toEqual([
			"#10b981", // emerald-500
			"#3b82f6", // blue-500
			"#475569", // slate-600
			"#dc2626", // red-600
			"#7c3aed", // violet-600
			"#db2777", // rose-600
			"#0891b2", // cyan-600
			"#6366f1", // indigo-600
		]);
	});

	it("calculates total clicks data correctly", async () => {
		const mockData = {
			userEngagement: {
				totalCoversGenerated: 100,
				totalDownloads: 50,
				successRate: 80,
				dailyTrend: [],
			},
			featurePopularity: {
				topFonts: [],
				topSizes: [],
				titleLengthStats: {
					avgTitleLength: 0,
					minTitleLength: 0,
					maxTitleLength: 0,
				},
				subtitleUsagePercent: 0,
			},
			accessibilityCompliance: {
				wcagDistribution: [],
				contrastStats: {
					avgContrastRatio: 0,
					minContrastRatio: 0,
					maxContrastRatio: 0,
				},
				wcagFailurePercent: 0,
				wcagTrend: [],
			},
		};

		// @ts-expect-error
		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ success: true, data: mockData }),
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
			userEngagement: {
				totalCoversGenerated: 0,
				totalDownloads: 0,
				successRate: 0,
				dailyTrend: [],
			},
			featurePopularity: {
				topFonts: [],
				topSizes: [],
				titleLengthStats: {
					avgTitleLength: 0,
					minTitleLength: 0,
					maxTitleLength: 0,
				},
				subtitleUsagePercent: 0,
			},
			accessibilityCompliance: {
				wcagDistribution: [],
				contrastStats: {
					avgContrastRatio: 0,
					minContrastRatio: 0,
					maxContrastRatio: 0,
				},
				wcagFailurePercent: 0,
				wcagTrend: [],
			},
		};

		// @ts-expect-error
		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ success: true, data: mockData }),
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

	it("generates daily trend data for last 7 days", async () => {
		const mockData = {
			userEngagement: {
				totalCoversGenerated: 100,
				totalDownloads: 50,
				successRate: 80,
				dailyTrend: [
					{ date: "2025-11-28", count: 5 },
					{ date: "2025-11-29", count: 10 },
					{ date: "2025-11-30", count: 15 },
					{ date: "2025-12-01", count: 12 },
					{ date: "2025-12-02", count: 20 },
					{ date: "2025-12-03", count: 18 },
					{ date: "2025-12-04", count: 25 },
					{ date: "2025-12-05", count: 15 },
				],
			},
			featurePopularity: {
				topFonts: [],
				topSizes: [],
				titleLengthStats: {
					avgTitleLength: 0,
					minTitleLength: 0,
					maxTitleLength: 0,
				},
				subtitleUsagePercent: 0,
			},
			accessibilityCompliance: {
				wcagDistribution: [],
				contrastStats: {
					avgContrastRatio: 0,
					minContrastRatio: 0,
					maxContrastRatio: 0,
				},
				wcagFailurePercent: 0,
				wcagTrend: [],
			},
		};

		// @ts-expect-error
		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ success: true, data: mockData }),
		});

		const { result } = renderHook(() => useAnalytics());

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		// Should have last 7 days of data
		expect(result.current.dailyTrendData.length).toBeLessThanOrEqual(7);

		// Each day should have the correct structure
		result.current.dailyTrendData.forEach((day) => {
			expect(day).toHaveProperty("date");
			expect(day).toHaveProperty("count");
			expect(typeof day.date).toBe("string");
			expect(typeof day.count).toBe("number");
		});
	});

	it("handles empty daily trend data", async () => {
		const mockData = {
			userEngagement: {
				totalCoversGenerated: 0,
				totalDownloads: 0,
				successRate: 0,
				dailyTrend: [], // No data
			},
			featurePopularity: {
				topFonts: [],
				topSizes: [],
				titleLengthStats: {
					avgTitleLength: 0,
					minTitleLength: 0,
					maxTitleLength: 0,
				},
				subtitleUsagePercent: 0,
			},
			accessibilityCompliance: {
				wcagDistribution: [],
				contrastStats: {
					avgContrastRatio: 0,
					minContrastRatio: 0,
					maxContrastRatio: 0,
				},
				wcagFailurePercent: 0,
				wcagTrend: [],
			},
		};

		// @ts-expect-error
		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ success: true, data: mockData }),
		});

		const { result } = renderHook(() => useAnalytics());

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		// Should have empty daily trend data
		expect(result.current.dailyTrendData).toEqual([]);
	});

	it("handles partial daily trend data", async () => {
		const mockData = {
			userEngagement: {
				totalCoversGenerated: 100,
				totalDownloads: 50,
				successRate: 80,
				dailyTrend: [
					{ date: "2025-12-04", count: 25 },
					{ date: "2025-12-05", count: 15 },
				],
			},
			featurePopularity: {
				topFonts: [],
				topSizes: [],
				titleLengthStats: {
					avgTitleLength: 0,
					minTitleLength: 0,
					maxTitleLength: 0,
				},
				subtitleUsagePercent: 0,
			},
			accessibilityCompliance: {
				wcagDistribution: [],
				contrastStats: {
					avgContrastRatio: 0,
					minContrastRatio: 0,
					maxContrastRatio: 0,
				},
				wcagFailurePercent: 0,
				wcagTrend: [],
			},
		};

		// @ts-expect-error
		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ success: true, data: mockData }),
		});

		const { result } = renderHook(() => useAnalytics());

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		// Check that the hook correctly handles partial daily data
		const dailyData = result.current.dailyTrendData;
		expect(dailyData.length).toBeLessThanOrEqual(7);
		expect(dailyData).toHaveLength(2);

		// Should have correct counts
		expect(dailyData[0].count).toBe(25);
		expect(dailyData[1].count).toBe(15);
	});

	it("calls fetch on component mount", async () => {
		// @ts-expect-error
		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ success: true, data: {} }),
		});

		renderHook(() => useAnalytics());

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith("/api/analytics");
		});

		expect(global.fetch).toHaveBeenCalledTimes(1);
	});

	it("handles fetch network error", async () => {
		const networkError = new Error("Network error");
		fetchMock.mockRejectedValueOnce(networkError);

		const { result } = renderHook(() => useAnalytics());

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		expect(result.current.error).toBe("Network error");
		expect(result.current.data).toBe(null);
	});

	it("handles non-Error thrown values", async () => {
		fetchMock.mockRejectedValueOnce("String error thrown");

		const { result } = renderHook(() => useAnalytics());

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
		});

		expect(result.current.error).toBe("Unknown error");
		expect(result.current.data).toBe(null);
	});
});
