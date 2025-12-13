import {
	app,
	type HttpRequest,
	type HttpResponseInit,
	type InvocationContext,
} from "@azure/functions";
import { connectMongoDB, getMetricModel } from "../lib/mongoose";
import type {
	AccessibilityCompliance,
	AnalyticsResult,
	FeaturePopularity,
	UserEngagement,
	WcagTrendItem,
} from "../shared/analytics";
import {
	DOWNLOAD_CLICK_EVENT,
	GENERATE_CLICK_EVENT,
	METRIC_STATUS_SUCCESS,
	type WcagLevel,
} from "../shared/metricPayload";
import { SIZE_PRESETS } from "../shared/validators";

type DailyTrendAggregate = {
	_id: string;
	count: number;
};

type FontAggregate = {
	_id: string;
	count: number;
};

type TitleStatsAggregate = {
	_id: null;
	avgTitleLength: number;
	minTitleLength: number;
	maxTitleLength: number;
};

type ContrastStatsAggregate = {
	_id: null;
	avgContrastRatio: number;
	minContrastRatio: number;
	maxContrastRatio: number;
};

type WcagDistributionAggregate = {
	_id: string;
	count: number;
};

type WcagTrendAggregate = {
	_id: {
		date: string;
		wcagLevel: WcagLevel;
	};
	count: number;
};

interface MetricModel {
	countDocuments(filter: Record<string, unknown>): Promise<number>;
	aggregate(pipeline: unknown[]): {
		then<T>(
			onfulfilled?: (value: unknown[]) => T | Promise<T>,
			onrejected?: (reason: unknown) => T | Promise<T>,
		): Promise<T>;
	};
}

interface DataFilter {
	status: string;
	titleLength: Record<string, number>;
	contrastRatio: Record<string, number>;
	wcagLevel: Record<string, string[]>;
}

// Helper function to match width and height to size preset label
function getSizePresetLabel(
	width: number | null,
	height: number | null,
): string {
	if (width === null || height === null) {
		return "others";
	}

	const preset = SIZE_PRESETS.find(
		(p) => p.width === width && p.height === height,
	);
	return preset ? preset.label : "others";
}

// GET /api/analytics
export async function analytics(
	_request: HttpRequest,
	context: InvocationContext,
): Promise<HttpResponseInit> {
	context.log("analytics() function triggered");

	try {
		await connectMongoDB(context);

		// Fetch all analytics aggregations
		const analyticsData = await fetchAggregatedAnalytics(context);

		return {
			status: 200,
			body: JSON.stringify({ data: analyticsData }),
			headers: { "Content-Type": "application/json" },
		};
	} catch (error) {
		context.error("Error fetching analytics:", error);
		return {
			status: 500,
			body: JSON.stringify({
				error: "Failed to fetch analytics",
			}),
			headers: { "Content-Type": "application/json" },
		};
	}
}

// Fetch user engagement metrics
async function fetchUserEngagement(
	Metric: MetricModel,
	completeDataFilter: DataFilter,
	thirtyDaysAgo: Date,
): Promise<UserEngagement> {
	// Total covers generated (only with complete data)
	const totalCoversGenerated = await Metric.countDocuments({
		event: GENERATE_CLICK_EVENT,
		...completeDataFilter,
	});

	// Total downloads (only download_click events with status success)
	const totalDownloads = await Metric.countDocuments({
		event: DOWNLOAD_CLICK_EVENT,
		status: METRIC_STATUS_SUCCESS,
	});

	// Overall success rate (from complete data only, counting only generate_click)
	const totalGenerateEvents = await Metric.countDocuments({
		event: GENERATE_CLICK_EVENT,
		status: METRIC_STATUS_SUCCESS,
	});
	const successfulGenerateEvents = await Metric.countDocuments({
		event: GENERATE_CLICK_EVENT,
		...completeDataFilter,
	});
	const downloadRate =
		totalGenerateEvents > 0
			? parseFloat(
					((successfulGenerateEvents / totalGenerateEvents) * 100).toFixed(2),
				)
			: 0;

	// Trend over time (daily counts for last 30 days, complete data only)
	const dailyTrend = (await Metric.aggregate([
		{
			$match: {
				timestamp: { $gte: thirtyDaysAgo },
				event: GENERATE_CLICK_EVENT,
				...completeDataFilter,
			},
		},
		{
			$group: {
				_id: {
					$dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
				},
				count: { $sum: 1 },
			},
		},
		{ $sort: { _id: 1 } },
	])) as DailyTrendAggregate[];

	return {
		totalCoversGenerated,
		totalDownloads,
		downloadRate,
		dailyTrend: dailyTrend.map((item) => ({
			date: item._id,
			count: item.count,
		})),
	};
}

// Fetch feature popularity metrics
async function fetchFeaturePopularity(
	Metric: MetricModel,
	completeDataFilter: DataFilter,
	totalCoversGenerated: number,
): Promise<FeaturePopularity> {
	// Most used fonts (complete data only)
	const topFonts = (await Metric.aggregate([
		{
			$match: {
				event: GENERATE_CLICK_EVENT,
				...completeDataFilter,
			},
		},
		{
			$group: {
				_id: "$font",
				count: { $sum: 1 },
			},
		},
		{ $sort: { count: -1 } },
		{ $limit: 10 },
	])) as FontAggregate[];

	// Most used sizes (complete data only)
	const topSizesRaw = (await Metric.aggregate([
		{
			$match: {
				event: GENERATE_CLICK_EVENT,
				...completeDataFilter,
			},
		},
		{
			$group: {
				_id: {
					width: "$size.width",
					height: "$size.height",
				},
				count: { $sum: 1 },
			},
		},
		{ $sort: { count: -1 } },
		{ $limit: 10 },
	])) as Array<{
		_id: { width: number | null; height: number | null };
		count: number;
	}>;

	const topSizes = topSizesRaw.map((item) => ({
		width: item._id.width,
		height: item._id.height,
		sizePreset: getSizePresetLabel(item._id.width, item._id.height),
		count: item.count,
	}));

	// Title length statistics (complete data only)
	const titleStats = (await Metric.aggregate([
		{
			$match: {
				event: GENERATE_CLICK_EVENT,
				...completeDataFilter,
			},
		},
		{
			$group: {
				_id: null,
				avgTitleLength: { $avg: "$titleLength" },
				minTitleLength: { $min: "$titleLength" },
				maxTitleLength: { $max: "$titleLength" },
			},
		},
	])) as TitleStatsAggregate[];

	// Subtitle usage (percentage with subtitles, complete data only)
	const withSubtitle = await Metric.countDocuments({
		event: GENERATE_CLICK_EVENT,
		...completeDataFilter,
		subtitleLength: { $gt: 0 },
	});
	const subtitleUsagePercent =
		totalCoversGenerated > 0
			? parseFloat(((withSubtitle / totalCoversGenerated) * 100).toFixed(2))
			: 0;

	return {
		topFonts: topFonts.map((item) => ({
			font: item._id,
			count: item.count,
		})),
		topSizes: topSizes.map((item) => ({
			size: item.sizePreset,
			count: item.count,
		})),
		titleLengthStats: titleStats[0] || {
			_id: null,
			avgTitleLength: 0,
			minTitleLength: 0,
			maxTitleLength: 0,
		},
		subtitleUsagePercent,
	};
}

// Fetch accessibility compliance metrics
async function fetchAccessibilityCompliance(
	Metric: MetricModel,
	completeDataFilter: DataFilter,
	thirtyDaysAgo: Date,
	totalCoversGenerated: number,
): Promise<AccessibilityCompliance> {
	// WCAG level distribution (complete data only)
	const wcagDistribution = (await Metric.aggregate([
		{
			$match: {
				event: GENERATE_CLICK_EVENT,
				...completeDataFilter,
			},
		},
		{
			$group: {
				_id: "$wcagLevel",
				count: { $sum: 1 },
			},
		},
	])) as WcagDistributionAggregate[];

	// Average contrast ratio (complete data only)
	const contrastStats = (await Metric.aggregate([
		{
			$match: {
				event: GENERATE_CLICK_EVENT,
				...completeDataFilter,
			},
		},
		{
			$group: {
				_id: null,
				avgContrastRatio: { $avg: "$contrastRatio" },
				minContrastRatio: { $min: "$contrastRatio" },
				maxContrastRatio: { $max: "$contrastRatio" },
			},
		},
	])) as ContrastStatsAggregate[];

	// WCAG failure rate (complete data only)
	const failureCount =
		wcagDistribution.find((item) => item._id === "FAIL")?.count || 0;
	const wcagFailurePercent =
		totalCoversGenerated > 0
			? parseFloat(((failureCount / totalCoversGenerated) * 100).toFixed(2))
			: 0;

	// WCAG trend over time (last 30 days, complete data only)
	const wcagTrend = (await Metric.aggregate([
		{
			$match: {
				timestamp: { $gte: thirtyDaysAgo },
				event: GENERATE_CLICK_EVENT,
				...completeDataFilter,
			},
		},
		{
			$group: {
				_id: {
					date: {
						$dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
					},
					wcagLevel: "$wcagLevel",
				},
				count: { $sum: 1 },
			},
		},
		{ $sort: { "_id.date": 1 } },
	])) as WcagTrendAggregate[];

	return {
		wcagDistribution: wcagDistribution.map((item) => ({
			level: item._id,
			count: item.count,
		})),
		contrastStats: contrastStats[0] || {
			_id: null,
			avgContrastRatio: 0,
			minContrastRatio: 0,
			maxContrastRatio: 0,
		},
		wcagFailurePercent,
		wcagTrend: (wcagTrend as WcagTrendAggregate[]).reduce(
			(acc: WcagTrendItem[], item) => {
				const date = item._id.date;
				const level = item._id.wcagLevel;
				const existing = acc.find((d) => d.date === date);
				if (existing) {
					existing[level] = item.count;
				} else {
					const entry: WcagTrendItem = { date };
					entry[level] = item.count;
					acc.push(entry);
				}
				return acc;
			},
			[],
		),
	};
}

// Fetch aggregated analytics from MongoDB
async function fetchAggregatedAnalytics(
	context: InvocationContext,
): Promise<AnalyticsResult> {
	try {
		const Metric = getMetricModel();

		const completeDataFilter = {
			status: METRIC_STATUS_SUCCESS,
			titleLength: { $gt: 0 },
			contrastRatio: { $gt: 0 },
			wcagLevel: { $in: ["AAA", "AA", "FAIL"] },
		};

		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const userEngagement = await fetchUserEngagement(
			Metric,
			completeDataFilter,
			thirtyDaysAgo,
		);

		const featurePopularity = await fetchFeaturePopularity(
			Metric,
			completeDataFilter,
			userEngagement.totalCoversGenerated,
		);

		const accessibilityCompliance = await fetchAccessibilityCompliance(
			Metric,
			completeDataFilter,
			thirtyDaysAgo,
			userEngagement.totalCoversGenerated,
		);

		context.log("Analytics aggregations complete");

		return {
			userEngagement,
			featurePopularity,
			accessibilityCompliance,
		};
	} catch (error) {
		context.error("Error fetching aggregated analytics:", error);
		throw error;
	}
}

app.http("analytics", {
	methods: ["GET"],
	authLevel: "anonymous",
	handler: analytics,
});
