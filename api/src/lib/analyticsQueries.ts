import type { InvocationContext } from "@azure/functions";
import type {
	AccessibilityCompliance,
	AnalyticsResult,
	FeaturePopularity,
	PerformanceMetrics,
	UserEngagement,
	WcagTrendItem,
} from "@cover-craft/shared";
import {
	DOWNLOAD_CLICK_EVENT,
	GENERATE_CLICK_EVENT,
	IMAGE_GENERATED_EVENT,
	METRIC_STATUS_SUCCESS,
	SIZE_PRESETS,
	SUBTITLE_LENGTH_THRESHOLDS,
	TITLE_LENGTH_THRESHOLDS,
	type WcagLevel,
} from "@cover-craft/shared";
import { getMetricModel } from "./mongoose";

// ===================================================================================
// Internal Types & Interfaces
// ===================================================================================

type DailyTrendAggregate = {
	_id: string;
	count: number;
};

type HourlyTrendAggregate = {
	_id: number;
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

type WeeklyTrendAggregate = {
	_id: string;
	percentage: number;
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

type PerformanceByDateAggregate = {
	_id: string;
	avgDuration: number;
};

// Interface for Mongoose Model to support aggregation
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

// ===================================================================================
// Helper Functions
// ===================================================================================

function calculatePercentile(values: number[], p: number): number {
	if (values.length === 0) return 0;
	const sorted = values.sort((a, b) => a - b);
	const index = Math.ceil((p / 100) * sorted.length) - 1;
	return sorted[Math.max(0, index)];
}

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

// ===================================================================================
// Core Data Fetching Functions
// ===================================================================================

// Fetch user engagement metrics
async function fetchUserEngagement(
	Metric: MetricModel,
	_completeDataFilter: DataFilter,
	thirtyDaysAgo: Date,
): Promise<UserEngagement> {
	// UI Generation Attempts (GENERATE_CLICK raw count)
	const uiGenerationAttempts = await Metric.countDocuments({
		event: GENERATE_CLICK_EVENT,
		// No data filter needed as this is just an intent signal now
	});

	// Total Successful Generations (IMAGE_GENERATED - actual backend success)
	const totalSuccessfulGenerations = await Metric.countDocuments({
		event: IMAGE_GENERATED_EVENT,
		status: METRIC_STATUS_SUCCESS,
	});

	// Total downloads (DOWNLOAD_CLICK with status success)
	const totalDownloads = await Metric.countDocuments({
		event: DOWNLOAD_CLICK_EVENT,
		status: METRIC_STATUS_SUCCESS,
	});

	// Download rate (UI Conversion: Downloads / UI Attempts)
	const downloadRate =
		uiGenerationAttempts > 0
			? Number(((totalDownloads / uiGenerationAttempts) * 100).toFixed(2))
			: 0;

	// API usage percent (Estimated Share of traffic NOT from UI)
	const estimatedApiGenerations = Math.max(
		0,
		totalSuccessfulGenerations - uiGenerationAttempts,
	);
	const apiUsagePercent =
		totalSuccessfulGenerations > 0
			? Number(
					(
						(estimatedApiGenerations / totalSuccessfulGenerations) *
						100
					).toFixed(2),
				)
			: 0;

	// UI usage percent (Complement of API usage)
	const uiUsagePercent =
		totalSuccessfulGenerations > 0
			? Number((100 - apiUsagePercent).toFixed(2))
			: 0;

	// Daily trend (last 30 days)
	const dailyTrend = (await Metric.aggregate([
		{
			$match: {
				timestamp: { $gte: thirtyDaysAgo },
				event: IMAGE_GENERATED_EVENT,
				status: METRIC_STATUS_SUCCESS,
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

	// Hourly trend (peak usage times)
	const hourlyTrend = (await Metric.aggregate([
		{
			$match: {
				timestamp: { $gte: thirtyDaysAgo },
				event: IMAGE_GENERATED_EVENT,
				status: METRIC_STATUS_SUCCESS,
			},
		},
		{
			$group: {
				_id: { $hour: "$timestamp" },
				count: { $sum: 1 },
			},
		},
		{ $sort: { _id: 1 } },
	])) as HourlyTrendAggregate[];

	return {
		uiGenerationAttempts,
		totalDownloads,
		downloadRate,
		dailyTrend: dailyTrend.map((item) => ({
			date: item._id,
			count: item.count,
		})),
		totalSuccessfulGenerations,
		uiUsagePercent,
		apiUsagePercent,
		hourlyTrend: hourlyTrend.map((item) => ({
			hour: item._id,
			count: item.count,
		})),
	};
}

// Fetch feature popularity metrics
async function fetchFeaturePopularity(
	Metric: MetricModel,
	completeDataFilter: DataFilter,
	totalCoversGenerated: number,
	thirtyDaysAgo: Date,
): Promise<FeaturePopularity> {
	// Most used fonts (complete data only)
	const topFonts = (await Metric.aggregate([
		{
			$match: {
				event: IMAGE_GENERATED_EVENT,
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
				event: IMAGE_GENERATED_EVENT,
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
				event: IMAGE_GENERATED_EVENT,
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

	// Title length distribution
	const titleDistribution = (await Metric.aggregate([
		{
			$match: {
				event: IMAGE_GENERATED_EVENT,
				...completeDataFilter,
			},
		},
		{
			$group: {
				_id: {
					$cond: [
						{ $lt: ["$titleLength", TITLE_LENGTH_THRESHOLDS.SHORT_MAX + 1] },
						"short",
						{
							$cond: [
								{
									$lt: ["$titleLength", TITLE_LENGTH_THRESHOLDS.MEDIUM_MAX + 1],
								},
								"medium",
								"long",
							],
						},
					],
				},
				count: { $sum: 1 },
			},
		},
	])) as Array<{ _id: string; count: number }>;

	// Parse title distribution
	const titleDistributionMap = {
		short: 0,
		medium: 0,
		long: 0,
	};
	titleDistribution.forEach((bucket) => {
		if (bucket._id === "short") titleDistributionMap.short = bucket.count;
		else if (bucket._id === "medium")
			titleDistributionMap.medium = bucket.count;
		else if (bucket._id === "long") titleDistributionMap.long = bucket.count;
	});

	// Subtitle usage (percentage with subtitles, complete data only)
	const withSubtitle = await Metric.countDocuments({
		event: IMAGE_GENERATED_EVENT,
		...completeDataFilter,
		subtitleLength: { $gt: 0 },
	});
	const subtitleUsagePercent =
		totalCoversGenerated > 0
			? Number(((withSubtitle / totalCoversGenerated) * 100).toFixed(2))
			: 0;

	// Subtitle distribution
	const subtitleDistribution = (await Metric.aggregate([
		{
			$match: {
				event: IMAGE_GENERATED_EVENT,
				...completeDataFilter,
			},
		},
		{
			$group: {
				_id: {
					$cond: [
						{ $eq: ["$subtitleLength", 0] },
						"none",
						{
							$cond: [
								{
									$lt: [
										"$subtitleLength",
										SUBTITLE_LENGTH_THRESHOLDS.SHORT_MAX + 1,
									],
								},
								"short",
								{
									$cond: [
										{
											$lt: [
												"$subtitleLength",
												SUBTITLE_LENGTH_THRESHOLDS.MEDIUM_MAX + 1,
											],
										},
										"medium",
										"long",
									],
								},
							],
						},
					],
				},
				count: { $sum: 1 },
			},
		},
	])) as Array<{ _id: string; count: number }>;

	// Parse subtitle distribution
	const subtitleDistributionMap = {
		none: 0,
		short: 0,
		medium: 0,
		long: 0,
	};
	subtitleDistribution.forEach((bucket) => {
		if (bucket._id === "none") subtitleDistributionMap.none = bucket.count;
		else if (bucket._id === "short")
			subtitleDistributionMap.short = bucket.count;
		else if (bucket._id === "medium")
			subtitleDistributionMap.medium = bucket.count;
		else if (bucket._id === "long") subtitleDistributionMap.long = bucket.count;
	});

	// Subtitle trend over time (weekly)
	const subtitleTrend = (await Metric.aggregate([
		{
			$match: {
				timestamp: { $gte: thirtyDaysAgo },
				event: IMAGE_GENERATED_EVENT,
				...completeDataFilter,
			},
		},
		{
			$group: {
				_id: {
					$dateToString: { format: "%G-W%V", date: "$timestamp" },
				},
				totalCount: { $sum: 1 },
				withSubtitle: {
					$sum: { $cond: [{ $gt: ["$subtitleLength", 0] }, 1, 0] },
				},
			},
		},
		{ $sort: { _id: 1 } },
		{
			$project: {
				_id: 1,
				percentage: {
					$cond: [
						{ $gt: ["$totalCount", 0] },
						{
							$round: [
								{
									$multiply: [
										{ $divide: ["$withSubtitle", "$totalCount"] },
										100,
									],
								},
								2,
							],
						},
						0,
					],
				},
			},
		},
	])) as WeeklyTrendAggregate[];

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
		titleLengthDistribution: titleDistributionMap,
		subtitleUsagePercent,
		subtitleUsageDistribution: subtitleDistributionMap,
		subtitleTrendOverTime: subtitleTrend.map((item) => ({
			week: item._id,
			percentage: item.percentage,
		})),
	};
}

// Fetch accessibility compliance metrics
async function fetchAccessibilityCompliance(
	Metric: MetricModel,
	completeDataFilter: DataFilter,
	thirtyDaysAgo: Date,
	_totalCoversGenerated: number,
): Promise<AccessibilityCompliance> {
	// WCAG level distribution (complete data only)
	const wcagDistribution = (await Metric.aggregate([
		{
			$match: {
				event: IMAGE_GENERATED_EVENT,
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
				event: IMAGE_GENERATED_EVENT,
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

	// WCAG trend over time (last 30 days, complete data only)
	const wcagTrend = (await Metric.aggregate([
		{
			$match: {
				timestamp: { $gte: thirtyDaysAgo },
				event: IMAGE_GENERATED_EVENT,
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

// Fetch performance metrics (duration tracking)
async function fetchPerformanceMetrics(
	Metric: MetricModel,
	thirtyDaysAgo: Date,
): Promise<PerformanceMetrics> {
	// Backend performance - get all durations for IMAGE_GENERATED events
	const backendDurations = (await Metric.aggregate([
		{
			$match: {
				event: IMAGE_GENERATED_EVENT,
				status: METRIC_STATUS_SUCCESS,
				duration: { $exists: true, $ne: null },
			},
		},
		{
			$project: {
				duration: 1,
				timestamp: 1,
			},
		},
	])) as Array<{ duration: number; timestamp: Date }>;

	// Client performance - get all client durations for GENERATE_CLICK events
	const clientDurations = (await Metric.aggregate([
		{
			$match: {
				event: GENERATE_CLICK_EVENT,
				status: METRIC_STATUS_SUCCESS,
				clientDuration: { $exists: true, $ne: null },
			},
		},
		{
			$project: {
				clientDuration: 1,
				timestamp: 1,
			},
		},
	])) as Array<{ clientDuration: number; timestamp: Date }>;

	// Calculate backend performance stats
	const backendValues = backendDurations.map((d) => d.duration);
	const backendAvg =
		backendValues.length > 0
			? backendValues.reduce((a, b) => a + b, 0) / backendValues.length
			: 0;
	const backendMin = backendValues.length > 0 ? Math.min(...backendValues) : 0;
	const backendMax = backendValues.length > 0 ? Math.max(...backendValues) : 0;
	const backendP50 = calculatePercentile(backendValues, 50);
	const backendP95 = calculatePercentile(backendValues, 95);
	const backendP99 = calculatePercentile(backendValues, 99);

	// Calculate client performance stats
	const clientValues = clientDurations.map((d) => d.clientDuration);
	const clientAvg =
		clientValues.length > 0
			? clientValues.reduce((a, b) => a + b, 0) / clientValues.length
			: 0;
	const clientMin = clientValues.length > 0 ? Math.min(...clientValues) : 0;
	const clientMax = clientValues.length > 0 ? Math.max(...clientValues) : 0;
	const clientP50 = calculatePercentile(clientValues, 50);
	const clientP95 = calculatePercentile(clientValues, 95);
	const clientP99 = calculatePercentile(clientValues, 99);

	// Backend duration trend (daily)
	const backendDurationTrend = (await Metric.aggregate([
		{
			$match: {
				timestamp: { $gte: thirtyDaysAgo },
				event: IMAGE_GENERATED_EVENT,
				status: METRIC_STATUS_SUCCESS,
				duration: { $exists: true },
			},
		},
		{
			$group: {
				_id: {
					$dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
				},
				avgDuration: { $avg: "$duration" },
			},
		},
		{ $sort: { _id: 1 } },
	])) as PerformanceByDateAggregate[];

	// Client duration trend (daily)
	const clientDurationTrend = (await Metric.aggregate([
		{
			$match: {
				timestamp: { $gte: thirtyDaysAgo },
				event: GENERATE_CLICK_EVENT,
				status: METRIC_STATUS_SUCCESS,
				clientDuration: { $exists: true },
			},
		},
		{
			$group: {
				_id: {
					$dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
				},
				avgDuration: { $avg: "$clientDuration" },
			},
		},
		{ $sort: { _id: 1 } },
	])) as PerformanceByDateAggregate[];

	// Performance by size - get raw data and calculate percentiles
	const performanceBySizeRaw = (await Metric.aggregate([
		{
			$match: {
				event: IMAGE_GENERATED_EVENT,
				status: METRIC_STATUS_SUCCESS,
			},
		},
		{
			$group: {
				_id: {
					width: "$size.width",
					height: "$size.height",
				},
				durations: { $push: "$duration" },
			},
		},
	])) as Array<{
		_id: { width: number | null; height: number | null };
		durations: number[];
	}>;

	// Get client durations by size from GENERATE_CLICK events
	const clientDurationsBySize = (await Metric.aggregate([
		{
			$match: {
				event: GENERATE_CLICK_EVENT,
				status: METRIC_STATUS_SUCCESS,
				clientDuration: { $exists: true, $ne: null },
			},
		},
		{
			$group: {
				_id: {
					width: "$size.width",
					height: "$size.height",
				},
				clientDurations: { $push: "$clientDuration" },
			},
		},
	])) as Array<{
		_id: { width: number | null; height: number | null };
		clientDurations: number[];
	}>;

	// Create a map for quick lookup
	const clientDurationsMap = new Map(
		clientDurationsBySize.map((item) => [
			`${item._id.width}-${item._id.height}`,
			item.clientDurations,
		]),
	);

	const performanceBySize = performanceBySizeRaw.map((item) => {
		const backendDurs = item.durations.filter((d) => d != null);
		const key = `${item._id.width}-${item._id.height}`;
		const clientDurs = clientDurationsMap.get(key) || [];

		const avgBackend =
			backendDurs.length > 0
				? backendDurs.reduce((a, b) => a + b, 0) / backendDurs.length
				: 0;
		const p95Backend =
			backendDurs.length > 0 ? calculatePercentile(backendDurs, 95) : 0;

		const avgClient =
			clientDurs.length > 0
				? clientDurs.reduce((a, b) => a + b, 0) / clientDurs.length
				: 0;
		const p95Client =
			clientDurs.length > 0 ? calculatePercentile(clientDurs, 95) : 0;

		return {
			size: getSizePresetLabel(item._id.width, item._id.height),
			avgBackendDuration: Number(avgBackend.toFixed(2)),
			p95BackendDuration: Number(p95Backend.toFixed(2)),
			avgClientDuration: Number(avgClient.toFixed(2)),
			p95ClientDuration: Number(p95Client.toFixed(2)),
		};
	});

	const avgNetworkLatency =
		backendAvg > 0 ? Number((clientAvg - backendAvg).toFixed(2)) : 0;

	return {
		backendPerformance: {
			avgBackendDuration: Number(backendAvg.toFixed(2)),
			minBackendDuration: Number(backendMin.toFixed(2)),
			maxBackendDuration: Number(backendMax.toFixed(2)),
			p50BackendDuration: Number(backendP50.toFixed(2)),
			p95BackendDuration: Number(backendP95.toFixed(2)),
			p99BackendDuration: Number(backendP99.toFixed(2)),
			backendDurationTrend: backendDurationTrend.map((item) => ({
				date: item._id,
				avgDuration: Number(item.avgDuration.toFixed(2)),
			})),
		},
		clientPerformance: {
			avgClientDuration: Number(clientAvg.toFixed(2)),
			minClientDuration: Number(clientMin.toFixed(2)),
			maxClientDuration: Number(clientMax.toFixed(2)),
			p50ClientDuration: Number(clientP50.toFixed(2)),
			p95ClientDuration: Number(clientP95.toFixed(2)),
			p99ClientDuration: Number(clientP99.toFixed(2)),
			clientDurationTrend: clientDurationTrend.map((item) => ({
				date: item._id,
				avgDuration: Number(item.avgDuration.toFixed(2)),
			})),
		},
		networkLatency: {
			avgNetworkLatency,
		},
		performanceBySize,
	};
}

// ===================================================================================
// Main Exported Coordinator
// ===================================================================================

/**
 * Orchestrates the fetching of all analytics data components.
 * This is the public interface used by the API handler.
 */
export async function fetchAggregatedAnalytics(
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
			userEngagement.totalSuccessfulGenerations,
			thirtyDaysAgo,
		);

		const accessibilityCompliance = await fetchAccessibilityCompliance(
			Metric,
			completeDataFilter,
			thirtyDaysAgo,
			userEngagement.totalSuccessfulGenerations,
		);

		const performanceMetrics = await fetchPerformanceMetrics(
			Metric,
			thirtyDaysAgo,
		);

		context.log("Analytics aggregations complete");

		return {
			userEngagement,
			featurePopularity,
			accessibilityCompliance,
			performanceMetrics,
		};
	} catch (error) {
		context.error("Error fetching aggregated analytics:", error);
		throw error;
	}
}
