import type { MockedFunction } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAnalytics, proxyAnalytics } from "./analytics";

const fetchMock: MockedFunction<typeof fetch> = vi.fn();
global.fetch = fetchMock;

describe("getAnalytics", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("calls the analytics endpoint and returns data", async () => {
		const mockAnalyticsData = {
			totalClicks: 150,
			generateClicks: 100,
			downloadClicks: 50,
		};
		// @ts-expect-error
		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => mockAnalyticsData,
		});

		const result = await getAnalytics();

		expect(fetchMock).toHaveBeenCalledWith("/api/analytics");
		expect(result).toEqual(mockAnalyticsData);
	});

	it("throws error when analytics fetch fails", async () => {
		// @ts-expect-error
		fetchMock.mockResolvedValueOnce({
			ok: false,
			statusText: "Service Unavailable",
		});

		await expect(getAnalytics()).rejects.toThrow(
			"Failed to fetch analytics: Service Unavailable",
		);
	});

	it("handles network errors gracefully", async () => {
		fetchMock.mockRejectedValueOnce(new Error("Network error"));

		await expect(getAnalytics()).rejects.toThrow("Network error");
	});

	it("returns data with different response formats", async () => {
		const mockData = { metrics: { total: 500 } };
		// @ts-expect-error
		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => mockData,
		});

		const result = await getAnalytics();

		expect(result).toEqual(mockData);
	});

	it("calls proxyAnalytics to backend API", async () => {
		const mockAnalyticsData = {
			totalClicks: 200,
			generateClicks: 120,
		};
		// @ts-expect-error
		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => mockAnalyticsData,
		});

		const result = await proxyAnalytics();

		expect(fetchMock).toHaveBeenCalledWith(
			`${process.env.NEXT_PUBLIC_API_URL}/analytics`,
		);
		expect(result).toEqual(mockAnalyticsData);
	});

	it("proxyAnalytics handles backend errors", async () => {
		// @ts-expect-error
		fetchMock.mockResolvedValueOnce({
			ok: false,
			statusText: "Backend Error",
		});

		await expect(proxyAnalytics()).rejects.toThrow(
			"Failed to fetch analytics: Backend Error",
		);
	});
});
