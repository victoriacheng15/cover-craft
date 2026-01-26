import type { MockedFunction } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { proxyHealth } from "./health";

const fetchMock: MockedFunction<typeof fetch> = vi.fn();
global.fetch = fetchMock;

describe("health", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("proxies health check to backend", async () => {
		const mockResponse = { status: "healthy", uptime: 3600 };
		// @ts-expect-error
		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => mockResponse,
		});

		const result = await proxyHealth();

		expect(fetchMock).toHaveBeenCalledWith(
			`${process.env.AZURE_FUNCTION_URL}/health`,
		);
		expect(result).toEqual(mockResponse);
	});

	it("proxyHealth throws error on backend failure", async () => {
		// @ts-expect-error
		fetchMock.mockResolvedValueOnce({
			ok: false,
			statusText: "Service Unavailable",
		});

		await expect(proxyHealth()).rejects.toThrow(
			"Health check failed: Service Unavailable",
		);
	});
});
