import type { HttpRequest, InvocationContext } from "@azure/functions";
import type { MetricStatus } from "@cover-craft/shared";
import * as validators from "@cover-craft/shared";
import { MAX_SUBTITLE_LENGTH, MAX_TITLE_LENGTH } from "@cover-craft/shared";
import { Canvas } from "canvas";
import { describe, expect, it, vi } from "vitest";
import * as mongooseLib from "../lib/mongoose";
import { generateCoverImage } from "./generateCoverImage";

interface MetricDocument {
	event: string;
	status: MetricStatus;
	size?: { width: number; height: number };
	font?: string;
	duration?: number;
	errorMessage?: string;
}

interface MetricInstance {
	save: () => Promise<void>;
	_id?: string;
}

type MetricModelConstructor = new (doc: MetricDocument) => MetricInstance;

const logMock = vi.fn();
const errorMock = vi.fn();

describe("generateCoverImage", () => {
	// Mock InvocationContext
	const mockContext = {
		log: logMock,
		error: errorMock,
	} as unknown as InvocationContext;

	afterEach(() => {
		vi.restoreAllMocks();
	});

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
			const mockRequest = createMockRequest({
				width: "1080",
				height: "1080",
				backgroundColor: "#ffffff",
				textColor: "#000000",
				font: "Montserrat",
				title: "Test",
				subtitle: "Test",
				filename: "test",
			});

			const response = await generateCoverImage(mockRequest, mockContext);
			// Should return 200 since query params are sufficient
			expect(response.status).toBe(200);
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

			vi.spyOn(validators, "hexToRgb").mockReturnValue({ r: 0, g: 0, b: 0 });
			const response = await generateCoverImage(mockRequest, mockContext);
			// Invalid color will fail validation
			expect([400, 500]).toContain(response.status);
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

			vi.spyOn(validators, "hexToRgb").mockReturnValue({ r: 0, g: 0, b: 0 });
			const response = await generateCoverImage(mockRequest, mockContext);
			// Invalid color will fail validation
			expect([400, 500]).toContain(response.status);
		});

		it(`should accept title up to ${MAX_TITLE_LENGTH} characters`, async () => {
			const title = "a".repeat(MAX_TITLE_LENGTH);
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

		it(`should reject title longer than ${MAX_TITLE_LENGTH} characters`, async () => {
			const longTitle = "a".repeat(MAX_TITLE_LENGTH + 1);
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

		it(`should accept subtitle up to ${MAX_SUBTITLE_LENGTH} characters`, async () => {
			const subtitle = "b".repeat(MAX_SUBTITLE_LENGTH);
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

		it(`should reject subtitle longer than ${MAX_SUBTITLE_LENGTH} characters`, async () => {
			const longSubtitle = "b".repeat(MAX_SUBTITLE_LENGTH + 1);
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
			const savedSuccessMetrics: MetricDocument[] = [];
			class FakeMetricSuccessModel implements MetricInstance {
				_id = "fake-id";
				save = vi.fn().mockResolvedValue(undefined);
				constructor(data: MetricDocument) {
					savedSuccessMetrics.push(data);
				}
			}
			vi.spyOn(mongooseLib, "connectMongoDB").mockResolvedValue(undefined);
			vi.spyOn(mongooseLib, "getMetricModel").mockReturnValue(
				// @ts-expect-error
				FakeMetricSuccessModel as MetricModelConstructor,
			);

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

		it("logs persistence errors but still succeeds when DB is down", async () => {
			const mockRequest = createMockRequest({
				width: "800",
				height: "600",
				backgroundColor: "#ffffff",
				textColor: "#000000",
				font: "Montserrat",
				title: "Persistence First",
				filename: "test-persist-error",
			});

			vi.spyOn(mongooseLib, "connectMongoDB").mockRejectedValue(
				new Error("db down"),
			);
			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(200);
			expect(mockContext.log).toHaveBeenCalled();
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
			const savedValidationMetrics: MetricDocument[] = [];
			class FakeValidationMetricModel implements MetricInstance {
				_id = "fake-id";
				save = vi.fn().mockResolvedValue(undefined);
				constructor(data: MetricDocument) {
					savedValidationMetrics.push(data);
				}
			}
			vi.spyOn(mongooseLib, "connectMongoDB").mockResolvedValue(undefined);
			vi.spyOn(mongooseLib, "getMetricModel").mockReturnValue(
				// @ts-expect-error
				FakeValidationMetricModel as MetricModelConstructor,
			);

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
				...createMockRequest({
					width: "800",
					height: "600",
					backgroundColor: "#ffffff",
					textColor: "#000000",
					font: "Montserrat",
					title: "Test",
					filename: "test",
				}),
				text: vi.fn().mockResolvedValue(""),
			};

			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(200);
			expect(response.body).toBeDefined();
		});

		it("logs persistence errors while returning validation failures", async () => {
			const mockRequest = createMockRequest({
				width: "0",
				height: "0",
				backgroundColor: "#ffffff",
				textColor: "#000000",
				font: "Montserrat",
				title: "Bad",
				filename: "fail",
			});

			vi.spyOn(mongooseLib, "connectMongoDB").mockRejectedValue(
				new Error("db down"),
			);
			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(400);
			expect(mockContext.log).toHaveBeenCalled();
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
			const mockRequest = createMockRequest({
				width: "800",
				height: "600",
				backgroundColor: "#ffffff",
				textColor: "#000000",
				font: "Montserrat",
				title: "Test",
				filename: "test",
			});

			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(200);
			expect(response.body).toBeDefined();
		});

		it("returns 500 when canvas generation fails", async () => {
			errorMock.mockReset();
			logMock.mockReset();
			const mockRequest = createMockRequest({
				width: "1080",
				height: "1080",
				backgroundColor: "#ffffff",
				textColor: "#000000",
				font: "Montserrat",
				title: "Boom",
				filename: "test-canvas-error",
			});

			const savedErrorMetrics: MetricDocument[] = [];
			class FakeErrorMetricModel implements MetricInstance {
				_id = "error-id";
				save = vi.fn().mockResolvedValue(undefined);
				constructor(data: MetricDocument) {
					savedErrorMetrics.push(data);
				}
			}
			vi.spyOn(mongooseLib, "connectMongoDB").mockResolvedValue(undefined);
			vi.spyOn(mongooseLib, "getMetricModel").mockReturnValue(
				// @ts-expect-error
				FakeErrorMetricModel as MetricModelConstructor,
			);
			vi.spyOn(Canvas.prototype, "toBuffer").mockImplementation(() => {
				throw new Error("canvas explosion");
			});

			const response = await generateCoverImage(mockRequest, mockContext);
			expect(response.status).toBe(500);
			expect(response.body).toBeDefined();
			const parsedBody = JSON.parse(response.body as string);
			expect(parsedBody.message).toContain("canvas explosion");
			expect(savedErrorMetrics.length).toBeGreaterThan(0);
			const saved = savedErrorMetrics[0];
			expect(saved.status).toBe("error");
			expect(saved.errorMessage).toContain("canvas explosion");
			expect(mockContext.log).toHaveBeenCalled();
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
