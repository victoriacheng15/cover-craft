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
	};
});

// Mock mongoose
vi.mock("../lib/mongoose", () => {
	const mockJobModel = { findById: mocks.mockJobFindById };
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

	it("should return 404 if job not found", async () => {
		const mockRequest = {
			query: new Map([["jobId", "non-existent"]]),
		} as unknown as HttpRequest;

		mocks.mockJobFindById.mockResolvedValue(null);

		const response = (await getJobStatus(
			mockRequest,
			mockContext,
		)) as HttpResponseInit;

		expect(response.status).toBe(404);
	});

	it("should return 200 with job details if found", async () => {
		const mockRequest = {
			query: new Map([["jobId", "exists"]]),
		} as unknown as HttpRequest;

		const mockJob = {
			_id: "exists",
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
		const body = response.jsonBody as Record<string, unknown>;
		expect(body.status).toBe(JOB_STATUS_PENDING);
	});
});
