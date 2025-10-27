import type { HttpRequest, InvocationContext } from "@azure/functions";
import { describe, expect, it, vi } from "vitest";
import { generateCoverImage } from "../generateCoverImage";

describe("generateCoverImage", () => {
	// Mock InvocationContext
	const mockContext = {
		log: vi.fn(),
	} as unknown as InvocationContext;

	it("should return greeting with query parameter name", async () => {
		const mockRequest = {
			url: "http://localhost:7071/api/generateCoverImage?name=Alice",
			query: new Map([["name", "Alice"]]),
			text: vi.fn(),
		} as unknown as HttpRequest;

		const response = await generateCoverImage(mockRequest, mockContext);
		expect(response.body).toBe("Hello, Alice!");
	});

	it("should use request body as fallback when no query parameter", async () => {
		const mockRequest = {
			url: "http://localhost:7071/api/generateCoverImage",
			query: new Map(),
			text: vi.fn().mockResolvedValue("Bob"),
		} as unknown as HttpRequest;

		const response = await generateCoverImage(mockRequest, mockContext);
		expect(response.body).toBe("Hello, Bob!");
	});

	it('should default to "world" when no query param or body provided', async () => {
		const mockRequest = {
			url: "http://localhost:7071/api/generateCoverImage",
			query: new Map(),
			text: vi.fn().mockResolvedValue(""),
		} as unknown as HttpRequest;

		const response = await generateCoverImage(mockRequest, mockContext);
		expect(response.body).toBe("Hello, world!");
	});

	it("should handle both GET and POST requests", async () => {
		const mockRequestGet = {
			url: "http://localhost:7071/api/generateCoverImage?name=GET",
			query: new Map([["name", "GET"]]),
			text: vi.fn(),
		} as unknown as HttpRequest;

		const mockRequestPost = {
			url: "http://localhost:7071/api/generateCoverImage",
			query: new Map(),
			text: vi.fn().mockResolvedValue("POST"),
		} as unknown as HttpRequest;

		const responseGet = await generateCoverImage(mockRequestGet, mockContext);
		const responsePost = await generateCoverImage(mockRequestPost, mockContext);

		expect(responseGet.body).toBe("Hello, GET!");
		expect(responsePost.body).toBe("Hello, POST!");
	});
});
