import { describe, expect, it } from "vitest";
import { handleApiError } from "./errorHandler";

describe("errorHandler", () => {
	describe("handleApiError", () => {
		it("returns 500 status with error message for Error instance", () => {
			const error = new Error("Test error message");
			const response = handleApiError(error, "testing");

			expect(response.status).toBe(500);
		});

		it("includes success: false and error message in response", async () => {
			const errorMessage = "Custom error";
			const error = new Error(errorMessage);
			const response = handleApiError(error, "testing");

			const body = await response.json();
			expect(body.success).toBe(false);
			expect(body.error).toBe(errorMessage);
		});

		it("handles non-Error objects with generic message", async () => {
			const response = handleApiError("String error", "testing");

			const body = await response.json();
			expect(body.error).toBe("An unexpected error occurred");
		});

		it("sets correct content-type header", () => {
			const error = new Error("Test error");
			const response = handleApiError(error, "testing");

			expect(response.headers.get("content-type")).toBe("application/json");
		});
	});
});
