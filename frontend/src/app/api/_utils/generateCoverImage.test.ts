import type { MockedFunction } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	generateCoverImage,
	proxyGenerateCoverImage,
} from "./generateCoverImage";

const fetchMock: MockedFunction<typeof fetch> = vi.fn();
global.fetch = fetchMock;

describe("generateCoverImage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("sends correct request with image parameters", async () => {
		const mockBlob = new Blob(["test"], { type: "image/png" });
		const params = {
			width: 1200,
			height: 627,
			backgroundColor: "#374151",
			textColor: "#f9fafb",
			font: "Montserrat",
			title: "Test Title",
			subtitle: "Test Subtitle",
			filename: "test-file",
		};

		fetchMock.mockResolvedValueOnce({
			ok: true,
			blob: async () => mockBlob,
			// @ts-expect-error
			headers: {
				get: (name: string) =>
					name.toLowerCase() === "x-generation-duration" ? "123" : null,
			},
		});

		const result = await generateCoverImage(params);

		expect(fetchMock).toHaveBeenCalledWith("/api/generateCoverImage", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(params),
		});
		expect(result.blob).toEqual(mockBlob);
		expect(result.clientDuration).toEqual(expect.any(Number));
		// duration is server-side only (backend 'image_generated' event) and is not returned to the frontend
		expect(result.duration).toBeUndefined();
	});

	it("throws error with custom error message from response", async () => {
		const params = {
			width: 1200,
			height: 627,
			backgroundColor: "#374151",
			textColor: "#f9fafb",
			font: "Montserrat",
			title: "Test Title",
			subtitle: undefined,
			filename: "test",
		};

		// @ts-expect-error
		fetchMock.mockResolvedValueOnce({
			ok: false,
			json: async () => ({ error: "Invalid parameters" }),
		});

		await expect(generateCoverImage(params)).rejects.toThrow(
			"Invalid parameters",
		);
	});

	it("throws generic error when no error message in response", async () => {
		const params = {
			width: 1200,
			height: 627,
			backgroundColor: "#374151",
			textColor: "#f9fafb",
			font: "Montserrat",
			title: "Test Title",
			subtitle: undefined,
			filename: "test",
		};

		// @ts-expect-error
		fetchMock.mockResolvedValueOnce({
			ok: false,
			json: async () => ({}),
		});

		await expect(generateCoverImage(params)).rejects.toThrow(
			"Failed to generate cover image",
		);
	});

	it("includes detailed fields when the backend returns metadata", async () => {
		const params = {
			width: 1200,
			height: 627,
			backgroundColor: "#374151",
			textColor: "#f9fafb",
			font: "Montserrat",
			title: "Test Title",
			subtitle: undefined,
			filename: "test",
		};
		const details = [
			{ field: "font", message: "Missing font" },
			{ field: "title", message: "Too short" },
		];

		// @ts-expect-error
		fetchMock.mockResolvedValueOnce({
			ok: false,
			json: async () => ({ error: "Invalid payload", details }),
		});

		await expect(generateCoverImage(params)).rejects.toMatchObject({
			details,
		});
	});

	it("falls back to generic error when response JSON parsing fails", async () => {
		const params = {
			width: 1200,
			height: 627,
			backgroundColor: "#374151",
			textColor: "#f9fafb",
			font: "Montserrat",
			title: "Test Title",
			subtitle: undefined,
			filename: "test",
		};

		// @ts-expect-error
		fetchMock.mockResolvedValueOnce({
			ok: false,
			json: async () => {
				throw new Error("Unexpected token");
			},
		});

		await expect(generateCoverImage(params)).rejects.toThrow(
			"Failed to generate cover image",
		);
	});

	it("forwards body to proxy generateCoverImage endpoint", async () => {
		const body = {
			width: 1200,
			height: 627,
			backgroundColor: "#ffffff",
			textColor: "#000000",
			font: "Inter",
			title: "Proxy Title",
			filename: "proxy-test",
		};

		const fakeResponse = { ok: true, status: 201 };
		// @ts-expect-error
		fetchMock.mockResolvedValueOnce(fakeResponse);

		const response = await proxyGenerateCoverImage(body);

		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringMatching(/generateCoverImage$/),
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(body),
			},
		);
		expect(response).toBe(fakeResponse);
	});
});
