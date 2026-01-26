import type { HttpRequest, InvocationContext } from "@azure/functions";
import type { MetricPayload } from "@cover-craft/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock connectMongoDB and getMetricModel
vi.mock("../lib/mongoose", () => {
	const mockMetricModel = vi.fn();
	mockMetricModel.prototype.save = vi
		.fn()
		.mockResolvedValue({ _id: "test-id" });

	const mockLogModel = vi.fn();
	mockLogModel.prototype.save = vi.fn().mockResolvedValue({ _id: "log-id" });

	return {
		connectMongoDB: vi.fn().mockResolvedValue(undefined),
		getMetricModel: vi.fn(() => mockMetricModel),
		getLogModel: vi.fn(() => mockLogModel),
	};
});

// Import after setting up mocks
import { metrics } from "./metrics";

describe("metrics", () => {
	const mockContext = {
		log: vi.fn(),
		error: vi.fn(),
	} as unknown as InvocationContext;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	const validMetricPayload: MetricPayload = {
		event: "IMAGE_GENERATED",
		timestamp: new Date().toISOString(),
		status: "success",
		duration: 150,
		size: { width: 1200, height: 627 },
		font: "Montserrat",
		titleLength: 30,
		subtitleLength: 50,
		contrastRatio: 5.5,
		wcagLevel: "AA",
	};

	it("should return status 200 on successful metrics storage", async () => {
		const mockRequest = {
			json: vi.fn().mockResolvedValue(validMetricPayload),
		} as unknown as HttpRequest;

		const response = await metrics(mockRequest, mockContext);
		expect(response.status).toBe(200);
	});

	it("should return data wrapper with received metrics and serverTime", async () => {
		const mockRequest = {
			json: vi.fn().mockResolvedValue(validMetricPayload),
		} as unknown as HttpRequest;

		const response = await metrics(mockRequest, mockContext);
		const body = JSON.parse(response.body as string);

		expect(body).toHaveProperty("data");
		expect(body.data).toHaveProperty("received");
		expect(body.data).toHaveProperty("serverTime");
		expect(body.data.received).toEqual(validMetricPayload);
	});

	it("should return status 400 when event field is missing", async () => {
		const incompletePayload = { ...validMetricPayload, event: undefined };
		const mockRequest = {
			json: vi.fn().mockResolvedValue(incompletePayload),
		} as unknown as HttpRequest;

		const response = await metrics(mockRequest, mockContext);

		expect(response.status).toBe(400);
		const body = JSON.parse(response.body as string);
		expect(body).toHaveProperty("error");
		expect(body.error).toBe("Missing required fields: event, timestamp");
	});

	it("should return status 400 when timestamp field is missing", async () => {
		const incompletePayload = { ...validMetricPayload, timestamp: undefined };
		const mockRequest = {
			json: vi.fn().mockResolvedValue(incompletePayload),
		} as unknown as HttpRequest;

		const response = await metrics(mockRequest, mockContext);

		expect(response.status).toBe(400);
		const body = JSON.parse(response.body as string);
		expect(body).toHaveProperty("error");
		expect(body.error).toBe("Missing required fields: event, timestamp");
	});

	it("should return status 500 and error message when exception occurs", async () => {
		const mockRequest = {
			json: vi.fn().mockRejectedValue(new Error("Database error")),
		} as unknown as HttpRequest;

		const response = await metrics(mockRequest, mockContext);

		expect(response.status).toBe(500);
		expect(response.headers).toEqual({ "Content-Type": "application/json" });
		const body = JSON.parse(response.body as string);
		expect(body).toHaveProperty("error");
		expect(body.error).toBe("Failed to process metrics");
	});

	it("should have correct Content-Type header on success", async () => {
		const mockRequest = {
			json: vi.fn().mockResolvedValue(validMetricPayload),
		} as unknown as HttpRequest;

		const response = await metrics(mockRequest, mockContext);
		expect(response.headers).toEqual({ "Content-Type": "application/json" });
	});

	it("should have correct Content-Type header on error", async () => {
		const mockRequest = {
			json: vi.fn().mockRejectedValue(new Error("Error")),
		} as unknown as HttpRequest;

		const response = await metrics(mockRequest, mockContext);
		expect(response.headers).toEqual({ "Content-Type": "application/json" });
	});
});
