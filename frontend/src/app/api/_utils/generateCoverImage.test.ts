import type { MockedFunction } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { proxyGenerateCoverImage } from "./generateCoverImage";

const fetchMock: MockedFunction<typeof fetch> = vi.fn();
global.fetch = fetchMock;

describe("generateCoverImage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
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
