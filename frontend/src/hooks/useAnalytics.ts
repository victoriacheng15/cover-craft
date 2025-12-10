import { useEffect, useState } from "react";
import { getAnalytics } from "@/_utils";

interface UserEngagement {
	totalCoversGenerated: number;
	totalDownloads: number;
	successRate: number;
	dailyTrend: { date: string; count: number }[];
}

interface FeaturePopularity {
	topFonts: { font: string; count: number }[];
	topSizes: { size: string; count: number }[];
	titleLengthStats: {
		avgTitleLength: number;
		minTitleLength: number;
		maxTitleLength: number;
	};
	subtitleUsagePercent: number;
}

interface AccessibilityCompliance {
	wcagDistribution: { level: string; count: number }[];
	contrastStats: {
		avgContrastRatio: number;
		minContrastRatio: number;
		maxContrastRatio: number;
	};
	wcagFailurePercent: number;
	wcagTrend: Array<{
		date: string;
		[key: string]: number | string;
	}>;
}

interface AnalyticsData {
	userEngagement: UserEngagement;
	featurePopularity: FeaturePopularity;
	accessibilityCompliance: AccessibilityCompliance;
}

export function useAnalytics() {
	const [data, setData] = useState<AnalyticsData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchAnalytics() {
			try {
				setLoading(true);
				setError(null);
				const json = await getAnalytics();
				setData(json.data);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Unknown error");
			} finally {
				setLoading(false);
			}
		}
		fetchAnalytics();
	}, []);

	// Chart colors - medium to dark colors for better contrast on whitesmoke background
	const COLORS = [
		"#10b981", // emerald-500
		"#3b82f6", // blue-500
		"#475569", // slate-600
		"#dc2626", // red-600
		"#7c3aed", // violet-600
		"#db2777", // rose-600
		"#0891b2", // cyan-600
		"#6366f1", // indigo-600
	];

	// Prepare data for total clicks chart, including combined total
	const totalGenerate = data?.userEngagement?.totalCoversGenerated || 0;
	const totalDownload = data?.userEngagement?.totalDownloads || 0;
	const totalCombined = totalGenerate + totalDownload;

	const totalClicksData = [
		{ name: "Total", value: totalCombined },
		{ name: "Generate", value: totalGenerate },
		{ name: "Download", value: totalDownload },
	];

	// Prepare data for daily trend chart (last 7 days from available data)
	const dailyTrendData = (data?.userEngagement?.dailyTrend || [])
		.slice(-7)
		.map((item) => ({
			date: new Date(item.date).toLocaleDateString("default", {
				month: "short",
				day: "numeric",
			}),
			count: item.count,
		}));

	return { data, loading, error, COLORS, totalClicksData, dailyTrendData };
}
