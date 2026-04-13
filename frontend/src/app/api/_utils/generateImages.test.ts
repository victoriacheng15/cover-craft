import type { MockedFunction } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { proxyGenerateImages } from "./generateImages";

const fetchMock: MockedFunction<typeof fetch> = vi.fn();
global.fetch = fetchMock;

describe("proxyGenerateImages", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.AZURE_FUNCTION_URL = "http://mock-api";
		process.env.AZURE_FUNCTION_KEY = "test-key";
	});

	it("forwards batch payload to backend API", async () => {
		const body = [
			{
				width: 1200,
				height: 627,
				backgroundColor: "#000",
				textColor: "#fff",
				font: "Montserrat",
				title: "Test",
				filename: "test",
			},
		];

		const fakeResponse = { ok: true, status: 202 };
		// @ts-expect-error
		fetchMock.mockResolvedValueOnce(fakeResponse);

		const response = await proxyGenerateImages(body);

		expect(fetchMock).toHaveBeenCalledWith("http://mock-api/generateImages", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-functions-key": "test-key",
			},
			body: JSON.stringify(body),
		});
		expect(response).toBe(fakeResponse);
	});

	it("throws when API URL is missing", async () => {
		delete process.env.AZURE_FUNCTION_URL;

		await expect(proxyGenerateImages([])).rejects.toThrow(
			"Azure Functions API URL is missing for batch generation.",
		);
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
