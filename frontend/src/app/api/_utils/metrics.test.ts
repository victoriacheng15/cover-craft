import type { MockedFunction } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { proxyMetrics } from "./metrics";

const fetchMock: MockedFunction<typeof fetch> = vi.fn();
global.fetch = fetchMock;

describe("metrics", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("proxies metrics to backend API", async () => {
		const metricsData = {
			event: "download_click",
			timestamp: Date.now(),
		};

		// @ts-expect-error
		fetchMock.mockResolvedValueOnce({
			ok: true,
			status: 200,
		});

		const result = await proxyMetrics(metricsData);

		expect(fetchMock).toHaveBeenCalledWith(
			`${process.env.AZURE_FUNCTION_URL}/metrics`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(metricsData),
			},
		);
		expect(result.ok).toBe(true);
	});

	it("proxyMetrics handles different data formats", async () => {
		const metricsData = { custom: "data", values: [1, 2, 3] };

		// @ts-expect-error
		fetchMock.mockResolvedValueOnce({
			ok: true,
			status: 201,
		});

		const result = await proxyMetrics(metricsData);

		expect(result.status).toBe(201);
	});
});
