import type { MockedFunction } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	DOWNLOAD_CLICK_EVENT,
	GENERATE_CLICK_EVENT,
	generateBatchImages,
	generateImage,
	getAnalytics,
	getBatchJobStatus,
	health,
	sendDownloadEvent,
	sendGenerateEvent,
	sendMetrics,
} from "./api";

const fetchMock: MockedFunction<typeof fetch> = vi.fn();
global.fetch = fetchMock;

describe("API Service Wrapper", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getAnalytics", () => {
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
	});

	describe("health", () => {
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

	describe("generateImage", () => {
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

			fetchMock.mockResolvedValueOnce({
				ok: true,
				blob: async () => mockBlob,
				// @ts-expect-error
				headers: {
					get: (name: string) =>
						name.toLowerCase() === "x-generation-duration" ? "123" : null,
				},
			});

			const result = await generateImage(params);

			expect(fetchMock).toHaveBeenCalledWith("/api/generateImage", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(params),
			});
			expect(result.blob).toEqual(mockBlob);
			expect(result.clientDuration).toEqual(expect.any(Number));
			expect(result.duration).toBeUndefined();
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

			// @ts-expect-error
			fetchMock.mockResolvedValueOnce({
				ok: false,
				json: async () => ({ error: "Invalid parameters" }),
			});

			await expect(generateImage(params)).rejects.toThrow("Invalid parameters");
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

			// @ts-expect-error
			fetchMock.mockResolvedValueOnce({
				ok: false,
				json: async () => ({}),
			});

			await expect(generateImage(params)).rejects.toThrow(
				"Failed to generate cover image",
			);
		});

		it("includes detailed fields when the backend returns metadata", async () => {
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
			const details = [
				{ field: "font", message: "Missing font" },
				{ field: "title", message: "Too short" },
			];

			// @ts-expect-error
			fetchMock.mockResolvedValueOnce({
				ok: false,
				json: async () => ({ error: "Invalid payload", details }),
			});

			await expect(generateImage(params)).rejects.toMatchObject({
				details,
			});
		});

		it("falls back to generic error when response JSON parsing fails", async () => {
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

			// @ts-expect-error
			fetchMock.mockResolvedValueOnce({
				ok: false,
				json: async () => {
					throw new Error("Unexpected token");
				},
			});

			await expect(generateImage(params)).rejects.toThrow(
				"Failed to generate cover image",
			);
		});
	});

	describe("generateBatchImages", () => {
		it("submits batch request and returns jobId", async () => {
			const params = [
				{
					width: 1200,
					height: 627,
					backgroundColor: "#374151",
					textColor: "#f9fafb",
					font: "Montserrat",
					title: "Batch 1",
					filename: "test-1",
				},
			];

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ jobId: "batch-123" }),
			});

			const result = await generateBatchImages(params);

			expect(fetchMock).toHaveBeenCalledWith("/api/generateImages", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(params),
			});
			expect(result.jobId).toBe("batch-123");
		});

		it("throws error when batch submission fails", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				json: async () => ({ error: "Max batch size exceeded" }),
			});

			await expect(generateBatchImages([])).rejects.toThrow(
				"Max batch size exceeded",
			);
		});
	});

	describe("getBatchJobStatus", () => {
		it("fetches job status correctly", async () => {
			const mockResponse = {
				id: "job-123",
				status: "processing",
				progress: 1,
				total: 2,
				results: [],
			};

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse,
			});

			const result = await getBatchJobStatus("job-123");

			expect(fetchMock).toHaveBeenCalledWith("/api/jobStatus?jobId=job-123");
			expect(result).toEqual(mockResponse);
		});

		it("throws error when status fetch fails", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
			});

			await expect(getBatchJobStatus("invalid-id")).rejects.toThrow(
				"Failed to fetch job status",
			);
		});
	});

	describe("sendMetrics", () => {
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

	describe("sendGenerateEvent", () => {
		it("sends generation click event with success status and properties", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true }),
			});

			const payload = {
				width: 1200,
				height: 627,
				font: "Inter",
			};

			await sendGenerateEvent(payload);

			expect(fetchMock).toHaveBeenCalledWith("/api/metrics", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: expect.stringContaining(`"event":"${GENERATE_CLICK_EVENT}"`),
			});
		});

		it("ignores call when payload is invalid", async () => {
			// Pass a value that causes validation failure
			// @ts-expect-error
			await sendGenerateEvent({ event: 123 });
			expect(fetchMock).not.toHaveBeenCalled();
		});

		it("silently catches errors on fetch failure", async () => {
			fetchMock.mockRejectedValueOnce(new Error("Network failure"));
			await expect(sendGenerateEvent({})).resolves.not.toThrow();
		});
	});

	describe("sendDownloadEvent", () => {
		it("sends download click event", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true }),
			});

			await sendDownloadEvent({ format: "png" });

			expect(fetchMock).toHaveBeenCalledWith("/api/metrics", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: expect.stringContaining(`"event":"${DOWNLOAD_CLICK_EVENT}"`),
			});
		});

		it("silently catches errors on fetch failure", async () => {
			fetchMock.mockRejectedValueOnce(new Error("Network failure"));
			await expect(sendDownloadEvent()).resolves.not.toThrow();
		});
	});
});
