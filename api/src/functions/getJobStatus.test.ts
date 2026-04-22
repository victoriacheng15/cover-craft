import type {
	HttpRequest,
	HttpResponseInit,
	InvocationContext,
} from "@azure/functions";
import { JOB_STATUS_PENDING } from "@cover-craft/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getJobStatus } from "./getJobStatus";

const mocks = vi.hoisted(() => {
	return {
		mockJobFindById: vi.fn(),
		mockJobAggregate: vi.fn(),
	};
});

// Mock mongoose
vi.mock("../lib/mongoose", () => {
	const mockJobModel = {
		findById: mocks.mockJobFindById,
		aggregate: mocks.mockJobAggregate,
	};
	return {
		connectMongoDB: vi.fn().mockResolvedValue(undefined),
		getJobModel: vi.fn(() => mockJobModel),
	};
});

describe("getJobStatus", () => {
	const mockContext = {
		log: vi.fn(),
		error: vi.fn(),
		invocationId: "test-invocation-id",
	} as unknown as InvocationContext;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should return 400 if jobId is missing", async () => {
		const mockRequest = {
			query: new Map(),
		} as unknown as HttpRequest;

		const response = (await getJobStatus(
			mockRequest,
			mockContext,
		)) as HttpResponseInit;

		expect(response.status).toBe(400);
	});

	it("should return 400 if jobId is an invalid format", async () => {
		const mockRequest = {
			query: new Map([["jobId", "too-short"]]),
		} as unknown as HttpRequest;

		const response = (await getJobStatus(
			mockRequest,
			mockContext,
		)) as HttpResponseInit;

		expect(response.status).toBe(400);
		expect(response.jsonBody).toEqual(
			expect.objectContaining({
				error: expect.stringContaining("Invalid Job ID format"),
			}),
		);
	});

	it("should return 404 if full jobId not found", async () => {
		const fullId = "69a0f2db7b65847194bf1aec";
		const mockRequest = {
			query: new Map([["jobId", fullId]]),
		} as unknown as HttpRequest;

		mocks.mockJobFindById.mockResolvedValue(null);

		const response = (await getJobStatus(
			mockRequest,
			mockContext,
		)) as HttpResponseInit;

		expect(response.status).toBe(404);
		expect(mocks.mockJobFindById).toHaveBeenCalledWith(fullId);
	});

	it("should return 200 with full jobId if found", async () => {
		const fullId = "69a0f2db7b65847194bf1aec";
		const mockRequest = {
			query: new Map([["jobId", fullId]]),
		} as unknown as HttpRequest;

		const mockJob = {
			_id: fullId,
			status: JOB_STATUS_PENDING,
			requests: [{}],
			results: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		mocks.mockJobFindById.mockResolvedValue(mockJob);

		const response = (await getJobStatus(
			mockRequest,
			mockContext,
		)) as HttpResponseInit;

		expect(response.status).toBe(200);
		expect(mocks.mockJobFindById).toHaveBeenCalledWith(fullId);
	});

	it("should return public string results from structured job result details", async () => {
		const fullId = "69a0f2db7b65847194bf1aec";
		const mockRequest = {
			query: new Map([["jobId", fullId]]),
		} as unknown as HttpRequest;

		const mockJob = {
			_id: fullId,
			status: JOB_STATUS_PENDING,
			requests: [{}, {}],
			results: [],
			resultDetails: {
				"1": {
					index: 1,
					status: "error",
					error: "failed",
					attempts: 3,
					updatedAt: new Date(),
				},
				"0": {
					index: 0,
					status: "success",
					dataUrl: "data:image/png;base64,img1",
					attempts: 1,
					updatedAt: new Date(),
				},
			},
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		mocks.mockJobFindById.mockResolvedValue(mockJob);

		const response = (await getJobStatus(
			mockRequest,
			mockContext,
		)) as HttpResponseInit;

		expect(response.status).toBe(200);
		expect(response.jsonBody).toEqual(
			expect.objectContaining({
				progress: 2,
				results: ["data:image/png;base64,img1", "error: failed"],
			}),
		);
	});

	it("should return 200 with partial jobId (8 chars) if found", async () => {
		const partialId = "94bf1aec";
		const mockRequest = {
			query: new Map([["jobId", partialId]]),
		} as unknown as HttpRequest;

		const mockJob = {
			_id: "69a0f2db7b65847194bf1aec",
			status: JOB_STATUS_PENDING,
			requests: [{}],
			results: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		mocks.mockJobAggregate.mockResolvedValue([mockJob]);

		const response = (await getJobStatus(
			mockRequest,
			mockContext,
		)) as HttpResponseInit;

		expect(response.status).toBe(200);
		expect(mocks.mockJobAggregate).toHaveBeenCalled();
		const body = response.jsonBody as { id: string };
		expect(body.id).toBe(mockJob._id);
	});

	it("should return 404 if partial jobId match is not found", async () => {
		const partialId = "ffffffff";
		const mockRequest = {
			query: new Map([["jobId", partialId]]),
		} as unknown as HttpRequest;

		mocks.mockJobAggregate.mockResolvedValue([]);

		const response = (await getJobStatus(
			mockRequest,
			mockContext,
		)) as HttpResponseInit;

		expect(response.status).toBe(404);
	});
});
