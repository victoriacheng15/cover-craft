import type { MockedFunction } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { proxyAnalytics } from "./analytics";

const fetchMock: MockedFunction<typeof fetch> = vi.fn();
global.fetch = fetchMock;

describe("getAnalytics", () => {
	beforeEach(() => {
		vi.clearAllMocks();
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
			`${process.env.AZURE_FUNCTION_URL}/analytics`,
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
