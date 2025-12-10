import type { MockedFunction } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { health, proxyHealth } from "./health";

const fetchMock: MockedFunction<typeof fetch> = vi.fn();
global.fetch = fetchMock;

describe("health", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("calls the health check endpoint and returns response", async () => {
		const mockResponse = { status: "ok", timestamp: "2024-01-01T00:00:00Z" };
		// @ts-expect-error
		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => mockResponse,
		});

		const result = await health();

		expect(fetchMock).toHaveBeenCalledWith("/api/health");
		expect(result).toEqual(mockResponse);
	});

	it("throws error when health check fails", async () => {
		// @ts-expect-error
		fetchMock.mockResolvedValueOnce({
			ok: false,
			statusText: "Internal Server Error",
		});

		await expect(health()).rejects.toThrow(
			"Health check failed: Internal Server Error",
		);
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
			`${process.env.NEXT_PUBLIC_API_URL}/health`,
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

	it("handles different status responses", async () => {
		const mockResponse = { status: "degraded" };
		// @ts-expect-error
		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => mockResponse,
		});

		const result = await health();

		expect(result.status).toBe("degraded");
	});
});
