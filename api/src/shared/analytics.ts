import type { WcagLevel } from "./metricPayload";

export type WcagTrendItem = {
	date: string;
} & Partial<Record<WcagLevel, number>>;

export type LengthDistribution = {
	short: number;
	medium: number;
	long: number;
};

export type SubtitleDistribution = {
	none: number; // 0 chars (subtitle-specific)
} & LengthDistribution;

export type HourlyTrendItem = {
	hour: number; // 0-23
	count: number;
};

export type WeeklyTrendItem = {
	week: string; // "2024-W01" format
	percentage: number;
};

export type PerformanceBySize = {
	size: string; // preset label
	avgBackendDuration: number;
	p95BackendDuration: number;
	avgClientDuration: number;
	p95ClientDuration: number;
};

export type UserEngagement = {
	totalCoversGenerated: number;
	totalDownloads: number;
	downloadRate: number;
	dailyTrend: Array<{ date: string; count: number }>;
	totalImagesGenerated: number;
	generationSuccessRate: number;
	apiUsagePercent: number;
	hourlyTrend: HourlyTrendItem[];
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
	titleLengthDistribution: LengthDistribution;
	subtitleUsagePercent: number;
	subtitleUsageDistribution: SubtitleDistribution;
	subtitleTrendOverTime: WeeklyTrendItem[];
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

export type PerformanceMetrics = {
	backendPerformance: {
		avgBackendDuration: number;
		minBackendDuration: number;
		maxBackendDuration: number;
		p50BackendDuration: number;
		p95BackendDuration: number;
		p99BackendDuration: number;
		backendDurationTrend: Array<{ date: string; avgDuration: number }>;
	};
	clientPerformance: {
		avgClientDuration: number;
		minClientDuration: number;
		maxClientDuration: number;
		p50ClientDuration: number;
		p95ClientDuration: number;
		p99ClientDuration: number;
		clientDurationTrend: Array<{ date: string; avgDuration: number }>;
	};
	networkLatency: {
		avgNetworkLatency: number;
	};
	performanceBySize: PerformanceBySize[];
};

export type AnalyticsResult = {
	userEngagement: UserEngagement;
	featurePopularity: FeaturePopularity;
	accessibilityCompliance: AccessibilityCompliance;
	performanceMetrics: PerformanceMetrics;
};
