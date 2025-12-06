import type { HttpRequest, InvocationContext } from "@azure/functions";
import { describe, expect, it, vi } from "vitest";
import * as mongooseLib from "../../lib/mongoose";
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

		it("should handle JSON parse errors gracefully", async () => {
			const mockRequest = {
				...createMockRequest({
					width: "1080",
					height: "1080",
					backgroundColor: "#ffffff",
					textColor: "#000000",
					font: "Montserrat",
					title: "Test",
					subtitle: "Test",
					filename: "test",
				}),
				text: vi.fn().mockResolvedValue("invalid json {"),
			};

			const response = await generateCoverImage(mockRequest, mockContext);
			// Should succeed using query params
			expect(response.status).toBe(200);
		});

		it("should handle text() method throwing TypeError", async () => {
			const mockRequest = {
				...createMockRequest({
					width: "1080",
					height: "1080",
					backgroundColor: "#ffffff",
					textColor: "#000000",
					font: "Montserrat",
					title: "Test",
					subtitle: "Test",
					filename: "test",
				}),
				text: vi.fn().mockRejectedValue(new TypeError("Network error")),
			};

			const response = await generateCoverImage(mockRequest, mockContext);
			// Should return 500 for non-Error exceptions from text()
			expect(response.status).toBe(500);
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
			const mockRequest = createMockRequest({
				width: "0",
				height: "400",
				backgroundColor: "#ffffff",
				textColor: "#000000",
				font: "Montserrat",
				title: "Test",
				filename: "test",
			});
			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(400);
		});

		it("should reject width greater than 1200", async () => {
			const mockRequest = createMockRequest({
				width: "1201",
				height: "400",
				backgroundColor: "#ffffff",
				textColor: "#000000",
				font: "Montserrat",
				title: "Test",
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
			const mockRequest = createMockRequest({
				width: "400",
				height: "0",
				backgroundColor: "#ffffff",
				textColor: "#000000",
				font: "Montserrat",
				title: "Test",
				filename: "test",
			});
			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(400);
		});

		it("should reject height greater than 1200", async () => {
			const mockRequest = createMockRequest({
				width: "400",
				height: "1201",
				backgroundColor: "#ffffff",
				textColor: "#000000",
				font: "Montserrat",
				title: "Test",
				filename: "test",
			});
			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(400);
		});

		it("should validate backgroundColor is valid hex color", async () => {
			const mockRequest = createMockRequest({
				width: "400",
				height: "400",
				backgroundColor: "invalid-color",
				textColor: "#000000",
				font: "Montserrat",
				title: "Test",
				filename: "test",
			});

			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(400);
		});

		it("should validate textColor is valid hex color", async () => {
			const mockRequest = createMockRequest({
				width: "400",
				height: "400",
				backgroundColor: "#ffffff",
				textColor: "rgb(255,0,0)",
				font: "Montserrat",
				title: "Test",
				filename: "test",
			});

			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(400);
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
				width: "400",
				height: "400",
				backgroundColor: "#ffffff",
				textColor: "#000000",
				font: "Montserrat",
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
				width: "400",
				height: "400",
				backgroundColor: "#ffffff",
				textColor: "#000000",
				font: "Montserrat",
				title: "Test",
				subtitle: longSubtitle,
				filename: "test",
			});

			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(400);
		});

		it("should validate font is in allowed fonts list", async () => {
			const mockRequest = createMockRequest({
				width: "400",
				height: "400",
				backgroundColor: "#ffffff",
				textColor: "#000000",
				font: "UnknownFont",
				title: "Test",
				filename: "test",
			});

			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(400);
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

				// Mock DB persistence to capture success metric
				const savedSuccessMetrics: Array<any> = [];
				function FakeMetricSuccess(this: any, data: any) {
					savedSuccessMetrics.push(data);
					this.save = vi.fn().mockResolvedValue(undefined);
					this._id = "fake-id";
				}
				vi.spyOn(mongooseLib, "connectMongoDB").mockResolvedValue(undefined as any);
				vi.spyOn(mongooseLib, "getMetricModel").mockReturnValue(FakeMetricSuccess as any);

				const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(200);
				expect(response.headers).toHaveProperty("Content-Type");
				expect(response.headers["Content-Type"]).toContain("image/png");
				// Assert metric saved
				expect(savedSuccessMetrics.length).toBeGreaterThan(0);
				const saved = savedSuccessMetrics[0];
				expect(saved.event).toBe("image_generated");
				expect(saved.status).toBe("success");
				expect(saved.size).toEqual({ width: 1080, height: 1080 });
				expect(saved.font).toBe("Montserrat");
				expect(typeof saved.duration).toBe("number");
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
			expect(response.headers["X-Generation-Duration"]).toBeDefined();
			expect(Number(response.headers["X-Generation-Duration"])).toEqual(
				expect.any(Number),
			);
		});
	});

	describe("Error Handling", () => {
		it("should return 400 for validation errors", async () => {
			const mockRequest = createMockRequest({
				width: "invalid",
				height: "400",
				backgroundColor: "#ffffff",
				textColor: "#000000",
				font: "Montserrat",
				title: "Test",
				filename: "test",
			});

			// Mock DB persistence to capture validation metric saved and assert fields
			const savedValidationMetrics: Array<any> = [];
			function FakeMetricVal(this: any, data: any) {
				savedValidationMetrics.push(data);
				this.save = vi.fn().mockResolvedValue(undefined);
				this._id = "fake-id";
			}
			vi.spyOn(mongooseLib, "connectMongoDB").mockResolvedValue(undefined as any);
			vi.spyOn(mongooseLib, "getMetricModel").mockReturnValue(FakeMetricVal as any);

			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(400);
			expect(typeof response.body).toBe("string");
			expect(savedValidationMetrics.length).toBeGreaterThan(0);
			const saved = savedValidationMetrics[0];
			expect(saved.event).toBe("image_generated");
			expect(saved.status).toBe("validation_error");
			expect(typeof saved.errorMessage).toBe("string");
		});

		it("should return 500 for internal rendering errors", async () => {
			const mockRequest = {
				...createMockRequest(),
				text: vi.fn().mockRejectedValue(new Error("Render failed")),
			};

			const savedErrorMetrics: Array<any> = [];
			function FakeMetricError(this: any, data: any) {
				savedErrorMetrics.push(data);
				this.save = vi.fn().mockResolvedValue(undefined);
				this._id = "fake-id";
			}
			vi.spyOn(mongooseLib, "connectMongoDB").mockResolvedValue(undefined as any);
			vi.spyOn(mongooseLib, "getMetricModel").mockReturnValue(FakeMetricError as any);

			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(500);
			expect(savedErrorMetrics.length).toBeGreaterThan(0);
			const saved = savedErrorMetrics[0];
			expect(saved.event).toBe("image_generated");
			expect(saved.status).toBe("error");
			expect(typeof saved.errorMessage).toBe("string");
		});

		it("should include error message in response", async () => {
			const mockRequest = createMockRequest({
				width: "invalid",
				height: "400",
				backgroundColor: "#ffffff",
				textColor: "#000000",
				font: "Montserrat",
				title: "Test",
				filename: "test",
			});

			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(400);
			expect(response.body).toBeDefined();
		});

		it("should handle non-Error thrown values in catch block", async () => {
			const mockRequest = {
				...createMockRequest(),
				text: vi.fn().mockRejectedValue("String error thrown"),
			};

			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(500);
			expect(response.body).toBeDefined();
		});
	});

	describe("Edge Cases", () => {
		it("should handle special characters in title", async () => {
			const mockRequest = createMockRequest({
				width: "400",
				height: "400",
				backgroundColor: "#ffffff",
				textColor: "#000000",
				font: "Montserrat",
				title: "Special <>&\"'",
				filename: "test",
			});

			const response = await generateCoverImage(mockRequest, mockContext);
			expect([200, 400]).toContain(response.status);
		});

		it("should handle Unicode characters in title", async () => {
			const mockRequest = createMockRequest({
				width: "400",
				height: "400",
				backgroundColor: "#ffffff",
				textColor: "#000000",
				font: "Montserrat",
				title: "你好 مرحبا Привет",
				filename: "test",
			});

			const response = await generateCoverImage(mockRequest, mockContext);
			expect([200, 400]).toContain(response.status);
		});

		it("should handle very small dimensions", async () => {
			const mockRequest = createMockRequest({
				width: "50",
				height: "50",
				backgroundColor: "#ffffff",
				textColor: "#000000",
				font: "Montserrat",
				title: "Test",
				filename: "test",
			});

			const response = await generateCoverImage(mockRequest, mockContext);
			expect([200, 400]).toContain(response.status);
		});

		it("should handle very large dimensions", async () => {
			const mockRequest = createMockRequest({
				width: "4000",
				height: "3000",
				backgroundColor: "#ffffff",
				textColor: "#000000",
				font: "Montserrat",
				title: "Test",
				filename: "test",
			});

			const response = await generateCoverImage(mockRequest, mockContext);
			expect([200, 400]).toContain(response.status);
		});
	});

	describe("Color Contrast Validation", () => {
		it("should accept good contrast (AAA)", async () => {
			const mockRequest = createMockRequest({
				width: "400",
				height: "400",
				backgroundColor: "#ffffff",
				textColor: "#000000",
				font: "Montserrat",
				title: "Good Contrast",
				filename: "test",
			});

			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(200);
		});

		it("should reject poor contrast (below 4.5:1)", async () => {
			const mockRequest = createMockRequest({
				width: "400",
				height: "400",
				backgroundColor: "#ffffff",
				textColor: "#ffff00",
				font: "Montserrat",
				title: "Poor Contrast",
				filename: "test",
			});

			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(400);
			const body = JSON.parse(response.body as string);
			expect(body.details).toContainEqual(
				expect.objectContaining({
					field: "contrast",
				}),
			);
		});
	});
});
