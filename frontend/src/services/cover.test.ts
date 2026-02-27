import type { MockedFunction } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateBatchImages, generateImage, getBatchJobStatus } from "./cover";

const fetchMock: MockedFunction<typeof fetch> = vi.fn();
global.fetch = fetchMock;

describe("generateImage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

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
		// duration is server-side only (backend 'image_generated' event) and is not returned to the frontend
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
	beforeEach(() => {
		vi.clearAllMocks();
	});

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
	beforeEach(() => {
		vi.clearAllMocks();
	});

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
