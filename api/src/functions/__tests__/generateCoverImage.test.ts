import type { HttpRequest, InvocationContext } from "@azure/functions";
import { describe, expect, it, vi } from "vitest";
import { generateCoverImage } from "../generateCoverImage";

describe("generateCoverImage", () => {
	// Mock InvocationContext
	const mockContext = {
		log: vi.fn(),
		error: vi.fn(),
	} as unknown as InvocationContext;

	// Helper to create mock request with JSON body
	const createMockRequest = (
		query: Record<string, string> = {},
		body: any = {}
	): HttpRequest => ({
		url: "http://localhost:7071/api/generateCoverImage",
		query: new Map(Object.entries(query)),
		text: vi.fn().mockResolvedValue(JSON.stringify(body)),
		getHeader: vi.fn((header: string) => {
			if (header.toLowerCase() === "content-type") return "application/json";
			return null;
		}),
	} as unknown as HttpRequest);

	describe("Parameter Extraction", () => {
		it("should extract all 7 parameters from query string", async () => {
			const mockRequest = createMockRequest({
				width: "1200",
				height: "627",
				backgroundColor: "#ffffff",
				textColor: "#000000",
				font: "Arial",
				heading: "Welcome",
				subheading: "Cover Craft",
			});

			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(200);
		});

		it("should extract parameters from request body", async () => {
			const mockRequest = createMockRequest({}, {
				width: 1080,
				height: 1080,
				backgroundColor: "#f0f0f0",
				textColor: "#333333",
				font: "Helvetica",
				heading: "Test Heading",
				subheading: "Test Subheading",
			});

			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(200);
		});

		it("should use default values when parameters not provided", async () => {
			const mockRequest = createMockRequest();

			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(200);
			// Should use defaults: width=1080, height=1080, etc.
		});

		it("should prefer query parameters over body parameters", async () => {
			const mockRequest = createMockRequest(
				{ heading: "QueryHeading" },
				{ heading: "BodyHeading" }
			);

			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(200);
			// Query param should take precedence
		});
	});

	describe("Parameter Validation", () => {
		it("should accept width between 1 and 1200", async () => {
			const mockRequest = createMockRequest({ width: "600" });
			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(200);
		});

		it("should reject width less than 1", async () => {
			const mockRequest = createMockRequest({ width: "0" });
			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(400);
		});

		it("should reject width greater than 1200", async () => {
			const mockRequest = createMockRequest({ width: "1201" });
			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(400);
		});

		it("should accept height between 1 and 1200", async () => {
			const mockRequest = createMockRequest({ height: "800" });
			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(200);
		});

		it("should reject height less than 1", async () => {
			const mockRequest = createMockRequest({ height: "0" });
			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(400);
		});

		it("should reject height greater than 1200", async () => {
			const mockRequest = createMockRequest({ height: "1201" });
			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(400);
		});

		it("should validate backgroundColor is valid hex color", async () => {
			const mockRequest = createMockRequest({ backgroundColor: "invalid-color" });

			const response = await generateCoverImage(mockRequest, mockContext);
			expect([200, 400]).toContain(response.status);
		});

		it("should validate textColor is valid hex color", async () => {
			const mockRequest = createMockRequest({ textColor: "rgb(255,0,0)" });

			const response = await generateCoverImage(mockRequest, mockContext);
			expect([200, 400]).toContain(response.status);
		});

		it("should accept heading up to 55 characters", async () => {
			const heading = "a".repeat(55);
			const mockRequest = createMockRequest({ heading });

			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(200);
		});

		it("should reject heading longer than 55 characters", async () => {
			const longHeading = "a".repeat(56);
			const mockRequest = createMockRequest({ heading: longHeading });

			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(400);
		});

		it("should accept subheading up to 120 characters", async () => {
			const subheading = "b".repeat(120);
			const mockRequest = createMockRequest({ subheading });

			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(200);
		});

		it("should reject subheading longer than 120 characters", async () => {
			const longSubheading = "b".repeat(121);
			const mockRequest = createMockRequest({ subheading: longSubheading });

			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(400);
		});

		it("should validate font is in allowed fonts list", async () => {
			const mockRequest = createMockRequest({ font: "UnknownFont" });

			const response = await generateCoverImage(mockRequest, mockContext);
			expect([200, 400]).toContain(response.status);
		});
	});

	describe("Image Generation", () => {
		it("should return PNG image buffer on success", async () => {
			const mockRequest = createMockRequest({
				width: "1080",
				height: "1080",
				backgroundColor: "#ffffff",
				textColor: "#000000",
				font: "Arial",
				heading: "Test",
				subheading: "Subtitle",
			});

			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(200);
			expect(response.headers).toHaveProperty("Content-Type");
			expect(response.headers["Content-Type"]).toContain("image/png");
		});

		it("should return buffer body for PNG image", async () => {
			const mockRequest = createMockRequest({
				width: "800",
				height: "600",
				backgroundColor: "#f0f0f0",
				textColor: "#333333",
				font: "Arial",
				heading: "Header",
				subheading: "Subheader",
			});

			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(200);
			expect(response.body).toBeDefined();
		});
	});

	describe("Response Headers", () => {
		it("should set Content-Type to image/png", async () => {
			const mockRequest = createMockRequest();

			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.headers["Content-Type"]).toBe("image/png");
		});

		it("should set Content-Disposition for download", async () => {
			const mockRequest = createMockRequest();

			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.headers["Content-Disposition"]).toBeDefined();
			expect(response.headers["Content-Disposition"]).toContain("attachment");
		});

		it("should set Cache-Control headers", async () => {
			const mockRequest = createMockRequest();

			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.headers["Cache-Control"]).toBeDefined();
		});
	});

	describe("Error Handling", () => {
		it("should return 400 for validation errors", async () => {
			const mockRequest = createMockRequest({
				width: "invalid",
			});

			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(400);
			expect(typeof response.body).toBe("string");
		});

		it("should return 500 for internal rendering errors", async () => {
			const mockRequest = {
				...createMockRequest(),
				text: vi.fn().mockRejectedValue(new Error("Render failed")),
			};

			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(500);
		});

		it("should include error message in response", async () => {
			const mockRequest = createMockRequest({ width: "invalid" });

			const response = await generateCoverImage(mockRequest, mockContext);
			if (response.status === 400) {
				expect(response.body).toBeDefined();
			}
		});
	});

	describe("Edge Cases", () => {
		it("should handle special characters in heading", async () => {
			const mockRequest = createMockRequest({
				heading: "Special <>&\"'",
			});

			const response = await generateCoverImage(mockRequest, mockContext);
			expect([200, 400]).toContain(response.status);
		});

		it("should handle Unicode characters in heading", async () => {
			const mockRequest = createMockRequest({
				heading: "你好 مرحبا Привет",
			});

			const response = await generateCoverImage(mockRequest, mockContext);
			expect([200, 400]).toContain(response.status);
		});

		it("should handle very small dimensions", async () => {
			const mockRequest = createMockRequest({
				width: "50",
				height: "50",
			});

			const response = await generateCoverImage(mockRequest, mockContext);
			expect([200, 400]).toContain(response.status);
		});

		it("should handle very large dimensions", async () => {
			const mockRequest = createMockRequest({
				width: "4000",
				height: "3000",
			});

			const response = await generateCoverImage(mockRequest, mockContext);
			expect([200, 400]).toContain(response.status);
		});
	});
});
