import type { HttpRequest, InvocationContext } from "@azure/functions";
import { describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("../../lib/mongoose", () => ({
	connectMongoDB: vi.fn().mockResolvedValue(undefined),
}));

import { healthCheck } from "../healthCheck";

describe("healthCheck", () => {
	// Mock InvocationContext
	const mockContext = {
		log: vi.fn(),
	} as unknown as InvocationContext;

	// Mock HttpRequest
	const mockRequest = {
		url: "http://localhost:7071/api/healthCheck",
	} as unknown as HttpRequest;

	it("should return status 200", async () => {
		const response = await healthCheck(mockRequest, mockContext);
		expect(response.status).toBe(200);
	});

	it("should have correct Content-Type header", async () => {
		const response = await healthCheck(mockRequest, mockContext);
		expect(response.headers).toEqual({ "Content-Type": "application/json" });
	});

	it("should return JSON with data wrapper containing localTime and isoTime fields", async () => {
		const response = await healthCheck(mockRequest, mockContext);
		const body = JSON.parse(response.body as string);
		expect(body).toHaveProperty("data");
		expect(body.data).toHaveProperty("localTime");
		expect(body.data).toHaveProperty("isoTime");
	});

	it("should return valid ISO time format", async () => {
		const response = await healthCheck(mockRequest, mockContext);
		const body = JSON.parse(response.body as string);
		expect(() => new Date(body.data.isoTime)).not.toThrow();
		expect(body.data.isoTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);
	});

	it("should return error response with status 500 and error message when exception occurs", async () => {
		const mockContextWithError = {
			log: vi.fn(),
			error: vi.fn(),
		} as unknown as InvocationContext;

		// Mock JSON.stringify to throw an error
		const originalStringify = JSON.stringify;
		vi.spyOn(JSON, "stringify").mockImplementationOnce(() => {
			throw new Error("Stringify error");
		});

		const response = await healthCheck(mockRequest, mockContextWithError);

		expect(response.status).toBe(500);
		expect(response.headers).toEqual({ "Content-Type": "application/json" });
		const body = JSON.parse(response.body as string);
		expect(body).toHaveProperty("error");
		expect(body.error).toBe("Health check failed");

		// Restore original stringify
		JSON.stringify = originalStringify;
	});
});
