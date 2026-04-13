import type { MockedFunction } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { proxyJobStatus } from "./jobStatus";

const fetchMock: MockedFunction<typeof fetch> = vi.fn();
global.fetch = fetchMock;

describe("proxyJobStatus", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.AZURE_FUNCTION_URL = "http://mock-api";
		process.env.AZURE_FUNCTION_KEY = "test-key";
	});

	it("calls backend getJobStatus with jobId", async () => {
		const mockJobId = "job-123";
		const fakeResponse = { ok: true, status: 200 };
		// @ts-expect-error
		fetchMock.mockResolvedValueOnce(fakeResponse);

		const response = await proxyJobStatus(mockJobId);

		expect(fetchMock).toHaveBeenCalledWith(
			"http://mock-api/getJobStatus?jobId=job-123",
			{
				headers: {
					"x-functions-key": "test-key",
				},
			},
		);
		expect(response).toBe(fakeResponse);
	});

	it("throws when API URL is missing", async () => {
		delete process.env.AZURE_FUNCTION_URL;

		await expect(proxyJobStatus("job-123")).rejects.toThrow(
			"Azure Functions API URL is missing for job status polling.",
		);
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
