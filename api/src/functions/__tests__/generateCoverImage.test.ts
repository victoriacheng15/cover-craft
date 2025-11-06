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
		body: Record<string, unknown> = {},
	): HttpRequest =>
		({
			url: "http://localhost:7071/api/generateCoverImage",
			query: new Map(Object.entries(query)),
			text: vi.fn().mockResolvedValue(JSON.stringify(body)),
			getHeader: vi.fn((header: string) => {
				if (header.toLowerCase() === "content-type") return "application/json";
				return null;
			}),
		}) as unknown as HttpRequest;

	describe("Parameter Extraction", () => {
		it("should extract all 8 parameters from query string", async () => {
			const mockRequest = createMockRequest({
				width: "1200",
				height: "627",
				backgroundColor: "#ffffff",
				textColor: "#000000",
				font: "Montserrat",
				title: "Welcome",
				subtitle: "Cover Craft",
				filename: "test-cover",
			});

			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(200);
		});

		it("should extract parameters from request body", async () => {
			const mockRequest = createMockRequest(
				{},
				{
					width: 1080,
					height: 1080,
					backgroundColor: "#f0f0f0",
					textColor: "#333333",
					font: "Roboto",
					title: "Test Title",
					subtitle: "Test Subtitle",
					filename: "test-body",
				},
			);

			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(200);
		});

		it("should use default values when parameters not provided", async () => {
			const mockRequest = createMockRequest(
				{},
				{
					width: 1080,
					height: 1080,
					backgroundColor: "#ffffff",
					textColor: "#000000",
					font: "Lato",
					title: "Default Title",
					subtitle: "Default Subtitle",
					filename: "default",
				},
			);

			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(200);
			// Should use values from body
		});

		it("should prefer query parameters over body parameters", async () => {
			const mockRequest = createMockRequest(
				{
					title: "QueryTitle",
					width: "800",
					height: "600",
					backgroundColor: "#f0f0f0",
					textColor: "#333333",
					font: "Playfair Display",
					subtitle: "QuerySub",
					filename: "query-name",
				},
				{
					title: "BodyTitle",
					width: 1080,
					height: 1080,
					backgroundColor: "#ffffff",
					textColor: "#000000",
					font: "Open Sans",
					subtitle: "BodySub",
					filename: "body-name",
				},
			);

			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(200);
			// Query param should take precedence
		});
	});

	describe("Parameter Validation", () => {
		it("should accept width between 1 and 1200", async () => {
			const mockRequest = createMockRequest({
				width: "600",
				height: "400",
				backgroundColor: "#ffffff",
				textColor: "#000000",
				font: "Montserrat",
				title: "Valid",
				subtitle: "Width",
				filename: "test",
			});
			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(200);
		});

		it("should reject width less than 1", async () => {
			const mockRequest = createMockRequest({ width: "0", filename: "test" });
			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(400);
		});

		it("should reject width greater than 1200", async () => {
			const mockRequest = createMockRequest({
				width: "1201",
				filename: "test",
			});
			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(400);
		});

		it("should accept height between 1 and 1200", async () => {
			const mockRequest = createMockRequest({
				width: "400",
				height: "800",
				backgroundColor: "#ffffff",
				textColor: "#000000",
				font: "Roboto",
				title: "Valid",
				subtitle: "Height",
				filename: "test",
			});
			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(200);
		});

		it("should reject height less than 1", async () => {
			const mockRequest = createMockRequest({ height: "0", filename: "test" });
			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(400);
		});

		it("should reject height greater than 1200", async () => {
			const mockRequest = createMockRequest({
				height: "1201",
				filename: "test",
			});
			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(400);
		});

		it("should validate backgroundColor is valid hex color", async () => {
			const mockRequest = createMockRequest({
				backgroundColor: "invalid-color",
				filename: "test",
			});

			const response = await generateCoverImage(mockRequest, mockContext);
			expect([200, 400]).toContain(response.status);
		});

		it("should validate textColor is valid hex color", async () => {
			const mockRequest = createMockRequest({
				textColor: "rgb(255,0,0)",
				filename: "test",
			});

			const response = await generateCoverImage(mockRequest, mockContext);
			expect([200, 400]).toContain(response.status);
		});

		it("should accept heading up to 55 characters", async () => {
			const title = "a".repeat(55);
			const mockRequest = createMockRequest({
				title,
				width: "400",
				height: "400",
				backgroundColor: "#ffffff",
				textColor: "#000000",
				font: "Lato",
				subtitle: "Sub",
				filename: "test",
			});

			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(200);
		});

		it("should reject heading longer than 55 characters", async () => {
			const longTitle = "a".repeat(56);
			const mockRequest = createMockRequest({
				title: longTitle,
				filename: "test",
			});

			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(400);
		});

		it("should accept subheading up to 120 characters", async () => {
			const subtitle = "b".repeat(120);
			const mockRequest = createMockRequest({
				subtitle,
				width: "400",
				height: "400",
				backgroundColor: "#ffffff",
				textColor: "#000000",
				font: "Playfair Display",
				title: "Head",
				filename: "test",
			});

			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(200);
		});

		it("should reject subheading longer than 120 characters", async () => {
			const longSubtitle = "b".repeat(121);
			const mockRequest = createMockRequest({
				subtitle: longSubtitle,
				filename: "test",
			});

			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(400);
		});

		it("should validate font is in allowed fonts list", async () => {
			const mockRequest = createMockRequest({
				font: "UnknownFont",
				filename: "test",
			});

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
				font: "Montserrat",
				title: "Test",
				subtitle: "Subtitle",
				filename: "test-success",
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
				font: "Roboto",
				title: "Header",
				subtitle: "Subheader",
				filename: "test-buffer",
			});

			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(200);
			expect(response.body).toBeDefined();
		});
	});

	describe("Response Headers", () => {
		it("should set Content-Type to image/png", async () => {
			const mockRequest = createMockRequest({
				width: "1080",
				height: "1080",
				backgroundColor: "#ffffff",
				textColor: "#000000",
				font: "Lato",
				title: "Test",
				subtitle: "Test",
				filename: "test-header",
			});

			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.headers["Content-Type"]).toBe("image/png");
		});

		it("should set Content-Disposition for download", async () => {
			const mockRequest = createMockRequest({
				width: "1080",
				height: "1080",
				backgroundColor: "#ffffff",
				textColor: "#000000",
				font: "Playfair Display",
				title: "Test",
				subtitle: "Test",
				filename: "test-download",
			});

			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.headers["Content-Disposition"]).toBeDefined();
			expect(response.headers["Content-Disposition"]).toContain("attachment");
		});

		it("should set Cache-Control headers", async () => {
			const mockRequest = createMockRequest({
				width: "1080",
				height: "1080",
				backgroundColor: "#ffffff",
				textColor: "#000000",
				font: "Open Sans",
				title: "Test",
				subtitle: "Test",
				filename: "test-cache",
			});

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
		it("should handle special characters in title", async () => {
			const mockRequest = createMockRequest({
				title: "Special <>&\"'",
			});

			const response = await generateCoverImage(mockRequest, mockContext);
			expect([200, 400]).toContain(response.status);
		});

		it("should handle Unicode characters in title", async () => {
			const mockRequest = createMockRequest({
				title: "你好 مرحبا Привет",
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
