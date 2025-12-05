import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from "@azure/functions";
import { connectMongoDB, getMetricModel } from "../lib/mongoose";

// GET /api/analytics
// Fetches aggregated analytics data from MongoDB
// Returns engagement, feature popularity, and accessibility compliance metrics
// Only exposes aggregated, non-sensitive summary data (safe for public)
export async function analytics(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
	context.log("analytics() function triggered");

	try {
		await connectMongoDB(context);

		// Fetch all analytics aggregations
		const analyticsData = await fetchAggregatedAnalytics(context);

		return {
			status: 200,
			body: JSON.stringify({ success: true, data: analyticsData }),
			headers: { "Content-Type": "application/json" },
		};
	} catch (error) {
		context.error("Error fetching analytics:", error);
		return {
			status: 500,
			body: JSON.stringify({ success: false, error: "Failed to fetch analytics" }),
			headers: { "Content-Type": "application/json" },
		};
	}
}

// Fetch aggregated analytics from MongoDB
async function fetchAggregatedAnalytics(context: InvocationContext): Promise<any> {
	try {
		const Metric = getMetricModel();

		// Filter: Only include documents with complete data (new schema)
		// Old migrated documents have titleLength: 0 and contrastRatio: 0 as defaults
		// Real data will have meaningful values
		const completeDataFilter = {
			status: "success",
			titleLength: { $gt: 0 },
			contrastRatio: { $gt: 0 },
			wcagLevel: { $in: ["AAA", "AA", "FAIL"] },
		};

		// ===== 1. USER ENGAGEMENT =====
		// Total covers generated (only with complete data)
		const totalCoversGenerated = await Metric.countDocuments({
			event: "generate_click",
			...completeDataFilter,
		});

		// Total downloads (only download_click events with status success)
		const totalDownloads = await Metric.countDocuments({
			event: "download_click",
			status: "success",
		});

		// Overall success rate (from complete data only, counting only generate_click)
		const totalGenerateEvents = await Metric.countDocuments({
			event: "generate_click",
			status: "success",
		});
		const successfulGenerateEvents = await Metric.countDocuments({
			event: "generate_click",
			...completeDataFilter,
		});
		const successRate =
			totalGenerateEvents > 0
				? parseFloat(((successfulGenerateEvents / totalGenerateEvents) * 100).toFixed(2))
				: 0;

		// Trend over time (daily counts for last 30 days, complete data only)
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const dailyTrend = await Metric.aggregate([
			{
				$match: {
					timestamp: { $gte: thirtyDaysAgo },
					event: "generate_click",
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
		]);

		const userEngagement = {
			totalCoversGenerated,
			totalDownloads,
			successRate,
			dailyTrend: dailyTrend.map((item) => ({
				date: item._id,
				count: item.count,
			})),
		};

		// ===== 2. FEATURE POPULARITY =====
		// Most used fonts (complete data only)
		const topFonts = await Metric.aggregate([
			{
				$match: {
					event: "generate_click",
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
		]);

		// Most used sizes (complete data only)
		const topSizes = await Metric.aggregate([
			{
				$match: {
					event: "generate_click",
					...completeDataFilter,
				},
			},
			{
				$group: {
					_id: "$sizePreset",
					count: { $sum: 1 },
				},
			},
			{ $sort: { count: -1 } },
			{ $limit: 10 },
		]);

		// Title length statistics (complete data only)
		const titleStats = await Metric.aggregate([
			{
				$match: {
					event: "generate_click",
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
		]);

		// Subtitle usage (percentage with subtitles, complete data only)
		const withSubtitle = await Metric.countDocuments({
			event: "generate_click",
			...completeDataFilter,
			subtitleLength: { $gt: 0 },
		});
		const subtitleUsagePercent =
			totalCoversGenerated > 0
				? parseFloat(((withSubtitle / totalCoversGenerated) * 100).toFixed(2))
				: 0;

		const featurePopularity = {
			topFonts: topFonts.map((item) => ({
				font: item._id,
				count: item.count,
			})),
			topSizes: topSizes.map((item) => ({
				size: item._id,
				count: item.count,
			})),
			titleLengthStats: titleStats[0] || {
				avgTitleLength: 0,
				minTitleLength: 0,
				maxTitleLength: 0,
			},
			subtitleUsagePercent,
		};

		// ===== 3. ACCESSIBILITY COMPLIANCE =====
		// WCAG level distribution (complete data only)
		const wcagDistribution = await Metric.aggregate([
			{
				$match: {
					event: "generate_click",
					...completeDataFilter,
				},
			},
			{
				$group: {
					_id: "$wcagLevel",
					count: { $sum: 1 },
				},
			},
		]);

		// Average contrast ratio (complete data only)
		const contrastStats = await Metric.aggregate([
			{
				$match: {
					event: "generate_click",
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
		]);

		// WCAG failure rate (complete data only)
		const failureCount = wcagDistribution.find((item) => item._id === "FAIL")?.count || 0;
		const wcagFailurePercent =
			totalCoversGenerated > 0
				? parseFloat(((failureCount / totalCoversGenerated) * 100).toFixed(2))
				: 0;

		// WCAG trend over time (last 30 days, complete data only)
		const wcagTrend = await Metric.aggregate([
			{
				$match: {
					timestamp: { $gte: thirtyDaysAgo },
					event: "generate_click",
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
		]);

		const accessibilityCompliance = {
			wcagDistribution: wcagDistribution.map((item) => ({
				level: item._id,
				count: item.count,
			})),
			contrastStats: contrastStats[0] || {
				avgContrastRatio: 0,
				minContrastRatio: 0,
				maxContrastRatio: 0,
			},
			wcagFailurePercent,
			wcagTrend: wcagTrend.reduce(
				(acc, item) => {
					const date = item._id.date;
					const existing = acc.find((d) => d.date === date);
					if (existing) {
						existing[item._id.wcagLevel] = item.count;
					} else {
						acc.push({
							date,
							[item._id.wcagLevel]: item.count,
						});
					}
					return acc;
				},
				[] as Array<{ date: string; [key: string]: number | string }>
			),
		};

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
