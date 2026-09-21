import { beforeEach, describe, expect, it, vi } from "vitest";
import * as apiUtils from "@/_utils";
import { POST } from "./route";

describe("POST /api/generateCarousel", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns 501 with error body from upstream stub", async () => {
		const mockResponse = new Response(
			JSON.stringify({
				error: "Carousel generation endpoint is not yet implemented",
			}),
			{
				status: 501,
				headers: { "Content-Type": "application/json" },
			},
		);

		vi.spyOn(apiUtils, "proxyGenerateCarousel").mockResolvedValueOnce(
			mockResponse,
		);

		const req = new Request("http://localhost/api/generateCarousel", {
			method: "POST",
			body: JSON.stringify({ title: "My Carousel" }),
			headers: { "Content-Type": "application/json" },
		});

		const res = await POST(req);
		expect(res.status).toBe(501);

		const data = await res.json();
		expect(data).toEqual({
			error: "Carousel generation endpoint is not yet implemented",
		});
	});

	it("returns successful response when upstream returns ok", async () => {
		const mockResponse = new Response(
			JSON.stringify({ id: "carousel-job-123" }),
			{
				status: 202,
				headers: { "Content-Type": "application/json" },
			},
		);

		vi.spyOn(apiUtils, "proxyGenerateCarousel").mockResolvedValueOnce(
			mockResponse,
		);

		const req = new Request("http://localhost/api/generateCarousel", {
			method: "POST",
			body: JSON.stringify({ title: "My Carousel" }),
			headers: { "Content-Type": "application/json" },
		});

		const res = await POST(req);
		expect(res.status).toBe(202);

		const data = await res.json();
		expect(data).toEqual({ id: "carousel-job-123" });
	});

	it("handles non-JSON error responses gracefully", async () => {
		const mockResponse = new Response("Gateway Timeout", {
			status: 504,
			statusText: "Gateway Timeout",
		});

		vi.spyOn(apiUtils, "proxyGenerateCarousel").mockResolvedValueOnce(
			mockResponse,
		);

		const req = new Request("http://localhost/api/generateCarousel", {
			method: "POST",
			body: JSON.stringify({ title: "My Carousel" }),
			headers: { "Content-Type": "application/json" },
		});

		const res = await POST(req);
		expect(res.status).toBe(504);

		const data = await res.json();
		expect(data).toEqual({ error: "Gateway Timeout" });
	});

	it("handles proxy exception with handleApiError", async () => {
		vi.spyOn(apiUtils, "proxyGenerateCarousel").mockRejectedValueOnce(
			new Error("Network connection dropped"),
		);

		const req = new Request("http://localhost/api/generateCarousel", {
			method: "POST",
			body: JSON.stringify({ title: "My Carousel" }),
			headers: { "Content-Type": "application/json" },
		});

		const res = await POST(req);
		expect(res.status).toBe(500);

		const data = await res.json();
		expect(data.error).toBe("Network connection dropped");
	});
});
