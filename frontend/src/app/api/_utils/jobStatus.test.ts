import type { MockedFunction } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { proxyJobStatus } from "./jobStatus";

const fetchMock: MockedFunction<typeof fetch> = vi.fn();
global.fetch = fetchMock;

describe("proxyJobStatus", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.AZURE_FUNCTION_URL = "http://mock-api";
	});

	it("calls backend getJobStatus with jobId", async () => {
		const mockJobId = "job-123";
		const fakeResponse = { ok: true, status: 200 };
		// @ts-expect-error
		fetchMock.mockResolvedValueOnce(fakeResponse);

		const response = await proxyJobStatus(mockJobId);

		expect(fetchMock).toHaveBeenCalledWith(
			"http://mock-api/getJobStatus?jobId=job-123",
		);
		expect(response).toBe(fakeResponse);
	});
});
