import type {
	HttpRequest,
	HttpResponseInit,
	InvocationContext,
} from "@azure/functions";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
	return {
		mockSendMessage: vi.fn(),
		mockCreateIfNotExists: vi.fn(),
		mockJobCreate: vi.fn(),
		mockLogCreate: vi.fn(),
		mockStoreMetrics: vi.fn(),
		mockBuildMetricPayload: vi.fn((status, data) => ({ status, ...data })),
	};
});

// Mock metrics
vi.mock("./metrics", () => ({
	storeMetricsToMongoDB: mocks.mockStoreMetrics,
	buildMetricPayload: mocks.mockBuildMetricPayload,
}));

// Mock @azure/storage-queue
vi.mock("@azure/storage-queue", () => {
	class MockQueueClient {
		createIfNotExists = mocks.mockCreateIfNotExists;
		sendMessage = mocks.mockSendMessage;
	}
	return {
		QueueClient: MockQueueClient,
	};
});

// Mock mongoose
vi.mock("../lib/mongoose", () => {
	const mockJobModel = { create: mocks.mockJobCreate };
	const mockLogModel = { create: mocks.mockLogCreate };
	return {
		connectMongoDB: vi.fn().mockResolvedValue(undefined),
		getJobModel: vi.fn(() => mockJobModel),
		getLogModel: vi.fn(() => mockLogModel),
	};
});

// Mock validation
vi.mock("@cover-craft/shared", async (importOriginal) => {
	const mod = await importOriginal<typeof import("@cover-craft/shared")>();
	return {
		...mod,
		validateBatchRequest: vi.fn(),
	};
});

import { JOB_STATUS_PENDING, validateBatchRequest } from "@cover-craft/shared";
import { generateImages } from "./generateImages";

describe("generateImages", () => {
	const mockContext = {
		log: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		invocationId: "test-invocation-id",
	} as unknown as InvocationContext;

	beforeEach(() => {
		vi.clearAllMocks();
		process.env.AzureWebJobsStorage = "UseDevelopmentStorage=true";
	});

	it("should return 400 if payload is not an array", async () => {
		const mockRequest = {
			json: vi.fn().mockResolvedValue({ not: "an array" }),
		} as unknown as HttpRequest;

		const response = (await generateImages(
			mockRequest,
			mockContext,
		)) as HttpResponseInit;

		expect(response.status).toBe(400);
		expect(response.jsonBody).toHaveProperty("error");
	});

	it("should return 400 if batch size exceeds limit", async () => {
		const oversizedBatch = Array(6).fill({
			title: "Sample",
			width: 800,
			height: 600,
			backgroundColor: "#000",
			textColor: "#fff",
			font: "Roboto",
		});

		const mockRequest = {
			json: vi.fn().mockResolvedValue(oversizedBatch),
		} as unknown as HttpRequest;

		(
			validateBatchRequest as unknown as ReturnType<typeof vi.fn>
		).mockReturnValue([
			{ field: "batch", message: "Batch request cannot exceed 5 items" },
		]);

		const response = (await generateImages(
			mockRequest,
			mockContext,
		)) as HttpResponseInit;

		expect(response.status).toBe(400);
		const body = response.jsonBody as { error: string };
		expect(body.error).toBe("Validation failed");
	});

	it("should return 400 if validation fails", async () => {
		const mockRequest = {
			json: vi.fn().mockResolvedValue([{}]),
		} as unknown as HttpRequest;

		(
			validateBatchRequest as unknown as ReturnType<typeof vi.fn>
		).mockReturnValue([{ field: "title", message: "Required" }]);

		const response = (await generateImages(
			mockRequest,
			mockContext,
		)) as HttpResponseInit;

		expect(response.status).toBe(400);
		const body = response.jsonBody as { error: string };
		expect(body.error).toBe("Validation failed");
		expect(mocks.mockStoreMetrics).toHaveBeenCalled();
	});

	it("should provision a job and return 202 on success", async () => {
		const mockRequest = {
			json: vi.fn().mockResolvedValue([
				{
					title: "Test",
					width: 800,
					height: 600,
					backgroundColor: "#000",
					textColor: "#fff",
					font: "Inter",
				},
			]),
		} as unknown as HttpRequest;

		(
			validateBatchRequest as unknown as ReturnType<typeof vi.fn>
		).mockReturnValue([]);

		const response = (await generateImages(
			mockRequest,
			mockContext,
		)) as HttpResponseInit;

		expect(response.status).toBe(202);
		expect(response.jsonBody).toHaveProperty("jobId");
		expect(mocks.mockJobCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				status: JOB_STATUS_PENDING,
				attempts: 0,
				maxAttempts: 3,
				resultDetails: {},
			}),
		);
		expect(mocks.mockStoreMetrics).not.toHaveBeenCalled();
		expect(mocks.mockCreateIfNotExists).toHaveBeenCalled();
		expect(mocks.mockSendMessage).toHaveBeenCalled();
	});
});
