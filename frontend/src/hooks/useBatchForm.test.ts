import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useBatchForm } from "./useBatchForm";

// Mock the services
vi.mock("@/services", () => ({
	generateBatchImages: vi.fn(),
	getBatchJobStatus: vi.fn(),
}));

import { generateBatchImages, getBatchJobStatus } from "@/services";
import type { JobStatusResponse } from "@/services/cover";

const generateBatchImagesMock = vi.mocked(generateBatchImages);
const getBatchJobStatusMock = vi.mocked(getBatchJobStatus);

describe("useBatchForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	it("initializes with default state", () => {
		const { result } = renderHook(() => useBatchForm());

		expect(result.current.jsonInput).toBe("");
		expect(result.current.jobId).toBe(null);
		expect(result.current.status).toBe(null);
		expect(result.current.isSubmitting).toBe(false);
		expect(result.current.isValid).toBe(false);
		expect(result.current.error).toBe(null);
	});

	it("validates valid JSON correctly", async () => {
		const { result } = renderHook(() => useBatchForm());
		const validJson = JSON.stringify([
			{
				title: "Test",
				width: 100,
				height: 100,
				backgroundColor: "#000000",
				textColor: "#FFFFFF",
				font: "Montserrat",
				filename: "test",
			},
		]);

		act(() => {
			result.current.setJsonInput(validJson);
		});

		// Validation is debounced (400ms)
		await act(async () => {
			vi.advanceTimersByTime(400);
		});

		expect(result.current.isValid).toBe(true);
		expect(result.current.error).toBe(null);
	});

	it("handles invalid JSON syntax", async () => {
		const { result } = renderHook(() => useBatchForm());

		act(() => {
			result.current.setJsonInput("{ invalid json }");
		});

		await act(async () => {
			vi.advanceTimersByTime(400);
		});

		expect(result.current.isValid).toBe(false);
		expect(result.current.error).toContain("Syntax Error");
	});

	it("handles schema validation errors", async () => {
		const { result } = renderHook(() => useBatchForm());
		// Missing required title
		const invalidSchema = JSON.stringify([{ width: 100 }]);

		act(() => {
			result.current.setJsonInput(invalidSchema);
		});

		await act(async () => {
			vi.advanceTimersByTime(400);
		});

		expect(result.current.isValid).toBe(false);
		expect(result.current.error).toContain("Schema Error");
	});

	it("submits batch job successfully and starts polling", async () => {
		const mockJobId = "job-123";
		generateBatchImagesMock.mockResolvedValueOnce({ jobId: mockJobId });
		getBatchJobStatusMock.mockResolvedValue({
			id: mockJobId,
			status: "pending",
			progress: 0,
			total: 1,
			results: [],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		} as JobStatusResponse);

		const { result } = renderHook(() => useBatchForm());
		const validJson = JSON.stringify([
			{
				title: "Test",
				width: 100,
				height: 100,
				backgroundColor: "#000000",
				textColor: "#FFFFFF",
				font: "Montserrat",
				filename: "test",
			},
		]);

		act(() => {
			result.current.setJsonInput(validJson);
		});

		await act(async () => {
			vi.advanceTimersByTime(400);
		});

		await act(async () => {
			await result.current.handleSubmit();
		});

		expect(generateBatchImagesMock).toHaveBeenCalled();
		expect(result.current.jobId).toBe(mockJobId);
		expect(getBatchJobStatusMock).toHaveBeenCalledWith(mockJobId);
	});

	it("stops polling when job is completed", async () => {
		const mockJobId = "job-complete";
		generateBatchImagesMock.mockResolvedValueOnce({ jobId: mockJobId });

		// Initial status
		getBatchJobStatusMock.mockResolvedValueOnce({
			id: mockJobId,
			status: "pending",
			progress: 0,
			total: 1,
			results: [],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		} as JobStatusResponse);

		// Status after 1 poll
		getBatchJobStatusMock.mockResolvedValueOnce({
			id: mockJobId,
			status: "completed",
			progress: 1,
			total: 1,
			results: ["data:image/png;base64,test"],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		} as JobStatusResponse);

		const { result } = renderHook(() => useBatchForm());
		act(() => {
			result.current.setJsonInput(
				JSON.stringify([
					{
						title: "Test",
						width: 100,
						height: 100,
						backgroundColor: "#000000",
						textColor: "#FFFFFF",
						font: "Montserrat",
						filename: "test",
					},
				]),
			);
		});

		await act(async () => {
			vi.advanceTimersByTime(400);
		});

		await act(async () => {
			await result.current.handleSubmit();
		});

		expect(result.current.status?.status).toBe("pending");

		// Trigger next poll
		await act(async () => {
			vi.advanceTimersByTime(3000);
		});

		expect(result.current.status?.status).toBe("completed");

		// Check if polling stopped (no more calls)
		await act(async () => {
			vi.advanceTimersByTime(3000);
		});

		expect(getBatchJobStatusMock).toHaveBeenCalledTimes(2);
	});

	it("formats JSON correctly", async () => {
		const { result } = renderHook(() => useBatchForm());
		const messyJson = '[{"title":"Test"}]';

		await act(async () => {
			result.current.setJsonInput(messyJson);
		});

		await act(async () => {
			result.current.handleFormatJson();
		});

		// Checks for pretty printing (indentation)
		expect(result.current.jsonInput).toContain('"title": "Test"');
	});

	it("handles lookup of existing job", async () => {
		const mockJobId = "lookup-id";
		getBatchJobStatusMock.mockResolvedValueOnce({
			id: mockJobId,
			status: "processing",
			progress: 1,
			total: 2,
			results: [],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		} as JobStatusResponse);

		const { result } = renderHook(() => useBatchForm());

		await act(async () => {
			result.current.handleLookup(mockJobId);
		});

		expect(result.current.jobId).toBe(mockJobId);
		expect(getBatchJobStatusMock).toHaveBeenCalledWith(mockJobId);
	});

	it("resets state correctly", () => {
		const { result } = renderHook(() => useBatchForm());

		act(() => {
			result.current.setJsonInput("test");
			result.current.handleReset();
		});

		expect(result.current.jsonInput).toBe("");
		expect(result.current.error).toBe(null);
	});
});
