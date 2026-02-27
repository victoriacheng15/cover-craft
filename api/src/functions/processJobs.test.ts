import type { InvocationContext } from "@azure/functions";
import {
	JOB_STATUS_COMPLETED,
	JOB_STATUS_PROCESSING,
} from "@cover-craft/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { processJobs } from "./processJobs";

const mocks = vi.hoisted(() => {
	return {
		mockJobFindOneAndUpdate: vi.fn(),
		mockJobFindByIdAndUpdate: vi.fn(),
		mockLogCreate: vi.fn(),
		mockGeneratePNG: vi.fn().mockResolvedValue(Buffer.from("fake-png")),
		mockStoreMetrics: vi.fn(),
	};
});

// Mock mongoose
vi.mock("../lib/mongoose", () => {
	const mockJobModel = {
		findOneAndUpdate: mocks.mockJobFindOneAndUpdate,
		findByIdAndUpdate: mocks.mockJobFindByIdAndUpdate,
	};
	const mockLogModel = { create: mocks.mockLogCreate };
	return {
		connectMongoDB: vi.fn().mockResolvedValue(undefined),
		getJobModel: vi.fn(() => mockJobModel),
		getLogModel: vi.fn(() => mockLogModel),
	};
});

// Mock service
vi.mock("../services/imageService", () => ({
	generatePNG: mocks.mockGeneratePNG,
}));

// Mock metrics
vi.mock("./metrics", () => ({
	storeMetricsToMongoDB: mocks.mockStoreMetrics,
	buildMetricPayload: vi.fn((status, data) => ({ status, ...data })),
}));

describe("processJobs", () => {
	const mockContext = {
		log: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		invocationId: "test-invocation-id",
	} as unknown as InvocationContext;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should process a job successfully", async () => {
		const jobId = "test-job-id";
		const mockJob = {
			_id: jobId,
			requests: [
				{
					title: "Test",
					width: 800,
					height: 600,
					backgroundColor: "#000",
					textColor: "#fff",
					font: "Inter",
				},
			],
		};

		mocks.mockJobFindOneAndUpdate.mockResolvedValue(mockJob);

		await processJobs(jobId, mockContext);

		expect(mocks.mockJobFindOneAndUpdate).toHaveBeenCalledWith(
			{ _id: jobId, status: "pending" },
			{ $set: { status: JOB_STATUS_PROCESSING } },
			{ new: true },
		);
		expect(mocks.mockGeneratePNG).toHaveBeenCalled();
		expect(mocks.mockJobFindByIdAndUpdate).toHaveBeenCalledWith(jobId, {
			$set: expect.objectContaining({
				status: JOB_STATUS_COMPLETED,
			}),
		});
		expect(mocks.mockStoreMetrics).toHaveBeenCalled();
	});
});
