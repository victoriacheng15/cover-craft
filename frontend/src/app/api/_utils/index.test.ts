import type { MockedFunction } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	handleApiError,
	type ImageParams,
	proxyAnalytics,
	proxyGenerateImage,
	proxyGenerateImages,
	proxyHealth,
	proxyJobStatus,
	proxyMetrics,
} from "./index";

const fetchMock: MockedFunction<typeof fetch> = vi.fn();
global.fetch = fetchMock;

describe("apiUtils", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.AZURE_FUNCTION_URL = "http://mock-api";
		process.env.AZURE_FUNCTION_KEY = "test-key";
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	describe("errorHandler", () => {
		it("returns 500 status with error message for Error instance", () => {
			const error = new Error("Test error message");
			const response = handleApiError(error, "testing");

			expect(response.status).toBe(500);
		});

		it("includes error message in unified error format", async () => {
			const errorMessage = "Custom error";
			const error = new Error(errorMessage);
			const response = handleApiError(error, "testing");

			const body = await response.json();
			expect(body.error).toBe(errorMessage);
			expect(body).not.toHaveProperty("success");
		});

		it("handles non-Error objects with generic message", async () => {
			const response = handleApiError("String error", "testing");

			const body = await response.json();
			expect(body.error).toBe("An unexpected error occurred");
		});

		it("sets correct content-type header", () => {
			const error = new Error("Test error");
			const response = handleApiError(error, "testing");

			expect(response.headers.get("content-type")).toBe("application/json");
		});
	});

	describe("proxyAnalytics", () => {
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

	describe("proxyGenerateImage", () => {
		it("forwards body to proxy generateImage endpoint", async () => {
			const body: ImageParams = {
				width: 1200,
				height: 627,
				backgroundColor: "#ffffff",
				textColor: "#000000",
				font: "Montserrat",
				title: "Proxy Title",
				filename: "proxy-test",
			};

			const fakeResponse = { ok: true, status: 201 };
			// @ts-expect-error
			fetchMock.mockResolvedValueOnce(fakeResponse);

			const response = await proxyGenerateImage(body);

			expect(fetchMock).toHaveBeenCalledWith(
				expect.stringMatching(/generateImage$/),
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(body),
				},
			);
			expect(response).toBe(fakeResponse);
		});
	});

	describe("proxyGenerateImages", () => {
		it("forwards batch payload to backend API", async () => {
			const body: ImageParams[] = [
				{
					width: 1200,
					height: 627,
					backgroundColor: "#000",
					textColor: "#fff",
					font: "Montserrat",
					title: "Test",
					filename: "test",
				},
			];

			const fakeResponse = { ok: true, status: 202 };
			// @ts-expect-error
			fetchMock.mockResolvedValueOnce(fakeResponse);

			const response = await proxyGenerateImages(body);

			expect(fetchMock).toHaveBeenCalledWith("http://mock-api/generateImages", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-functions-key": "test-key",
				},
				body: JSON.stringify(body),
			});
			expect(response).toBe(fakeResponse);
		});

		it("throws when API URL is missing", async () => {
			delete process.env.AZURE_FUNCTION_URL;

			await expect(proxyGenerateImages([])).rejects.toThrow(
				"Azure Functions API URL is missing for batch generation.",
			);
			expect(fetchMock).not.toHaveBeenCalled();
		});
	});

	describe("proxyHealth", () => {
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

	describe("proxyJobStatus", () => {
		it("calls backend getJobStatus with jobId", async () => {
			const mockJobId = "job-123";
			const fakeResponse = { ok: true, status: 200 };
			// @ts-expect-error
			fetchMock.mockResolvedValueOnce(fakeResponse);

			const response = await proxyJobStatus(mockJobId);

			expect(fetchMock).toHaveBeenCalledWith(
				"http://mock-api/getJobStatus?jobId=job-123",
				{
					headers: {
						"x-functions-key": "test-key",
					},
				},
			);
			expect(response).toBe(fakeResponse);
		});

		it("throws when API URL is missing", async () => {
			delete process.env.AZURE_FUNCTION_URL;

			await expect(proxyJobStatus("job-123")).rejects.toThrow(
				"Azure Functions API URL is missing for job status polling.",
			);
			expect(fetchMock).not.toHaveBeenCalled();
		});
	});

	describe("proxyMetrics", () => {
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
});
