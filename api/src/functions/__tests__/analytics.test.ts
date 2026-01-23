import type { HttpRequest, InvocationContext } from "@azure/functions";
import type { AnalyticsResult } from "@cover-craft/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("../../lib/mongoose", () => {
	const mockLogModel = vi.fn();
	mockLogModel.prototype.save = vi
		.fn()
		.mockResolvedValue({ _id: "test-log-id" });

	return {
		connectMongoDB: vi.fn().mockResolvedValue(undefined),
		getLogModel: vi.fn(() => mockLogModel),
	};
});

vi.mock("../../lib/analyticsQueries", () => ({
	fetchAggregatedAnalytics: vi.fn(),
}));

import { fetchAggregatedAnalytics } from "../../lib/analyticsQueries";
import { analytics } from "../analytics";

describe("analytics", () => {
	const mockContext = {
		log: vi.fn(),
		error: vi.fn(),
	} as unknown as InvocationContext;

	const mockRequest = {} as HttpRequest;

	// Mock data matching the AnalyticsResult interface
	const mockAnalyticsResult: AnalyticsResult = {
		userEngagement: {
			uiGenerationAttempts: 100,
			totalSuccessfulGenerations: 80,
			totalDownloads: 40,
			downloadRate: 40,
			apiUsagePercent: 20,
			uiUsagePercent: 80,
			dailyTrend: [],
			hourlyTrend: [],
		},
		featurePopularity: {
			topFonts: [],
			topSizes: [],
			titleLengthStats: {
				_id: null,
				avgTitleLength: 0,
				minTitleLength: 0,
				maxTitleLength: 0,
			},
			titleLengthDistribution: { short: 0, medium: 0, long: 0 },
			subtitleUsagePercent: 0,
			subtitleUsageDistribution: { none: 0, short: 0, medium: 0, long: 0 },
			subtitleTrendOverTime: [],
		},
		accessibilityCompliance: {
			wcagDistribution: [],
			contrastStats: {
				_id: null,
				avgContrastRatio: 0,
				minContrastRatio: 0,
				maxContrastRatio: 0,
			},
			wcagTrend: [],
		},
		performanceMetrics: {
			backendPerformance: {
				avgBackendDuration: 0,
				minBackendDuration: 0,
				maxBackendDuration: 0,
				p50BackendDuration: 0,
				p95BackendDuration: 0,
				p99BackendDuration: 0,
				backendDurationTrend: [],
			},
			clientPerformance: {
				avgClientDuration: 0,
				minClientDuration: 0,
				maxClientDuration: 0,
				p50ClientDuration: 0,
				p95ClientDuration: 0,
				p99ClientDuration: 0,
				clientDurationTrend: [],
			},
			networkLatency: {
				avgNetworkLatency: 0,
			},
			performanceBySize: [],
		},
	};

	beforeEach(() => {
		vi.clearAllMocks();
		(
			fetchAggregatedAnalytics as unknown as ReturnType<typeof vi.fn>
		).mockResolvedValue(mockAnalyticsResult);
	});

	it("should return status 200 and analytics data on success", async () => {
		const response = await analytics(mockRequest, mockContext);

		expect(response.status).toBe(200);
		expect(response.headers).toEqual({ "Content-Type": "application/json" });

		const body = JSON.parse(response.body as string);
		expect(body).toHaveProperty("data");
		expect(body.data).toEqual(mockAnalyticsResult);
	});

	it("should return correct structure for userEngagement", async () => {
		const response = await analytics(mockRequest, mockContext);
		const body = JSON.parse(response.body as string);
		const userEngagement = body.data.userEngagement;

		expect(userEngagement).toHaveProperty("uiUsagePercent");
		expect(userEngagement).toHaveProperty("apiUsagePercent");
		expect(userEngagement).not.toHaveProperty("successRate"); // Ensure old field is gone
	});

	it("should return correct structure for accessibilityCompliance", async () => {
		const response = await analytics(mockRequest, mockContext);
		const body = JSON.parse(response.body as string);
		const accessibility = body.data.accessibilityCompliance;

		expect(accessibility).toHaveProperty("wcagTrend");
		expect(accessibility).not.toHaveProperty("wcagFailurePercent"); // Ensure old field is gone
	});

	it("should return status 500 when fetching analytics fails", async () => {
		const error = new Error("Database error");
		(
			fetchAggregatedAnalytics as unknown as ReturnType<typeof vi.fn>
		).mockRejectedValue(error);

		const response = await analytics(mockRequest, mockContext);

		expect(response.status).toBe(500);
		expect(mockContext.log).toHaveBeenCalled();
		const body = JSON.parse(response.body as string);
		expect(body).toEqual({ error: "Failed to fetch analytics" });
	});
});
