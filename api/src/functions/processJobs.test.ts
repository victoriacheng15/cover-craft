import type { InvocationContext } from "@azure/functions";
import {
	JOB_STATUS_COMPLETED,
	JOB_STATUS_FAILED,
	JOB_STATUS_PROCESSING,
} from "@cover-craft/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { processJobs } from "./processJobs";

const mocks = vi.hoisted(() => {
	return {
		mockJobFindOneAndUpdate: vi.fn(),
		mockJobFindByIdAndUpdate: vi.fn(),
		mockJobFindById: vi.fn(),
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
		findById: mocks.mockJobFindById,
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
		mocks.mockGeneratePNG.mockResolvedValue(Buffer.from("fake-png"));
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
			resultDetails: {},
		};

		mocks.mockJobFindOneAndUpdate.mockResolvedValue(mockJob);

		await processJobs(jobId, mockContext);

		expect(mocks.mockJobFindOneAndUpdate).toHaveBeenCalledWith(
			expect.objectContaining({
				_id: jobId,
				$or: expect.arrayContaining([
					expect.objectContaining({ status: "pending" }),
					expect.objectContaining({ status: JOB_STATUS_PROCESSING }),
				]),
			}),
			expect.objectContaining({
				$set: expect.objectContaining({
					status: JOB_STATUS_PROCESSING,
					processingStartedAt: expect.any(Date),
				}),
				$inc: { attempts: 1 },
			}),
			{ new: true },
		);
		expect(mocks.mockGeneratePNG).toHaveBeenCalled();
		expect(mocks.mockJobFindByIdAndUpdate).toHaveBeenCalledWith(jobId, {
			$set: expect.objectContaining({
				"resultDetails.0": expect.objectContaining({
					index: 0,
					status: "success",
					attempts: 1,
				}),
				"results.0": expect.stringContaining("data:image/png;base64,"),
			}),
		});
		expect(mocks.mockJobFindByIdAndUpdate).toHaveBeenCalledWith(jobId, {
			$set: expect.objectContaining({
				status: JOB_STATUS_COMPLETED,
			}),
			$unset: expect.objectContaining({
				processingStartedAt: "",
			}),
		});
		expect(mocks.mockStoreMetrics).toHaveBeenCalled();
	});

	it("should retry an image render before storing the final result", async () => {
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
			resultDetails: {},
		};

		mocks.mockJobFindOneAndUpdate.mockResolvedValue(mockJob);
		mocks.mockGeneratePNG
			.mockRejectedValueOnce(new Error("temporary canvas failure"))
			.mockResolvedValueOnce(Buffer.from("fake-png"));

		await processJobs(jobId, mockContext);

		expect(mocks.mockGeneratePNG).toHaveBeenCalledTimes(2);
		expect(mocks.mockJobFindByIdAndUpdate).toHaveBeenCalledWith(jobId, {
			$set: expect.objectContaining({
				"resultDetails.0": expect.objectContaining({
					status: "success",
					attempts: 2,
				}),
			}),
		});
	});

	it("should skip image indexes that already have final results", async () => {
		const jobId = "test-job-id";
		const existingDetail = {
			index: 0,
			status: "success" as const,
			dataUrl: "data:image/png;base64,existing",
			attempts: 1,
			updatedAt: new Date(),
		};
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
			resultDetails: { "0": existingDetail },
		};

		mocks.mockJobFindOneAndUpdate.mockResolvedValue(mockJob);

		await processJobs(jobId, mockContext);

		expect(mocks.mockGeneratePNG).not.toHaveBeenCalled();
		expect(mocks.mockJobFindByIdAndUpdate).toHaveBeenCalledWith(jobId, {
			$set: expect.objectContaining({
				status: JOB_STATUS_COMPLETED,
				results: ["data:image/png;base64,existing"],
			}),
			$unset: expect.objectContaining({
				processingStartedAt: "",
			}),
		});
	});

	it("should fail the job when all image attempts fail", async () => {
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
			resultDetails: {},
		};

		mocks.mockJobFindOneAndUpdate.mockResolvedValue(mockJob);
		mocks.mockGeneratePNG.mockRejectedValue(new Error("canvas failed"));

		await processJobs(jobId, mockContext);

		expect(mocks.mockGeneratePNG).toHaveBeenCalledTimes(3);
		expect(mocks.mockJobFindByIdAndUpdate).toHaveBeenCalledWith(jobId, {
			$set: expect.objectContaining({
				status: JOB_STATUS_FAILED,
				error: "All images failed to generate.",
			}),
			$unset: expect.objectContaining({
				processingStartedAt: "",
			}),
		});
	});
});
