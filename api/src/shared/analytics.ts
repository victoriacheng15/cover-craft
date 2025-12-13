import type { WcagLevel } from "./metricPayload";

export type WcagTrendItem = {
	date: string;
} & Partial<Record<WcagLevel, number>>;

export type UserEngagement = {
	totalCoversGenerated: number;
	totalDownloads: number;
	downloadRate: number;
	dailyTrend: Array<{ date: string; count: number }>;
};

export type FeaturePopularity = {
	topFonts: Array<{ font: string; count: number }>;
	topSizes: Array<{ size: string; count: number }>;
	titleLengthStats: {
		_id: null;
		avgTitleLength: number;
		minTitleLength: number;
		maxTitleLength: number;
	};
	subtitleUsagePercent: number;
};

export type AccessibilityCompliance = {
	wcagDistribution: Array<{ level: string; count: number }>;
	contrastStats: {
		_id: null;
		avgContrastRatio: number;
		minContrastRatio: number;
		maxContrastRatio: number;
	};
	wcagFailurePercent: number;
	wcagTrend: WcagTrendItem[];
};

export type AnalyticsResult = {
	userEngagement: UserEngagement;
	featurePopularity: FeaturePopularity;
	accessibilityCompliance: AccessibilityCompliance;
};
