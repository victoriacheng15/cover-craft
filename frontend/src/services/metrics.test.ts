import type { MockedFunction } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendMetrics } from "./metrics";

const fetchMock: MockedFunction<typeof fetch> = vi.fn();
global.fetch = fetchMock;

describe("metrics", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("sends metrics data to the metrics endpoint", async () => {
		const metricsData = {
			event: "generate_click",
			timestamp: Date.now(),
			status: "success",
		};

		// @ts-expect-error
		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ success: true }),
		});

		const result = await sendMetrics(metricsData);

		expect(fetchMock).toHaveBeenCalledWith("/api/metrics", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(metricsData),
		});
		expect(result).toEqual({ success: true });
	});

	it("throws error when metrics send fails", async () => {
		const metricsData = {
			event: "generate_click",
			timestamp: Date.now(),
			status: "error",
		};

		// @ts-expect-error
		fetchMock.mockResolvedValueOnce({
			ok: false,
			statusText: "Internal Server Error",
		});

		await expect(sendMetrics(metricsData)).rejects.toThrow(
			"Failed to send metrics: Internal Server Error",
		);
	});

	it("sends metrics with complex payload", async () => {
		const complexMetrics = {
			event: "image_generated",
			duration: 1234,
			params: { width: 1200, height: 627 },
		};

		// @ts-expect-error
		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ recorded: true }),
		});

		await sendMetrics(complexMetrics);

		expect(fetchMock).toHaveBeenCalledWith("/api/metrics", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(complexMetrics),
		});
	});
});
