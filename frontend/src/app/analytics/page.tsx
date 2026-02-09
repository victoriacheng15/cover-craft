"use client";

import MainLayout from "@/components/layout/MainLayout";
import { SectionTitle } from "@/components/ui";
import { useAnalytics } from "@/hooks";
import {
	AccessibilityMetrics,
	AccessibilityMetricsSkeleton,
} from "./_components/AccessibilityMetrics";
import {
	FeaturePopularity,
	FeaturePopularitySkeleton,
} from "./_components/FeaturePopularity";
import {
	PerformanceMetrics,
	PerformanceMetricsSkeleton,
} from "./_components/PerformanceMetrics";
import {
	UserEngagement,
	UserEngagementSkeleton,
} from "./_components/UserEngagement";

export default function AnalyticsPage() {
	const {
		userEngagement,
		featurePopularity,
		accessibilityCompliance,
		performanceMetrics,
		loading,
		error,
		COLORS,
		dailyTrendData,
	} = useAnalytics();

	return (
		<MainLayout>
			<div className="max-w-3xl mx-auto">
				<div className="flex flex-col gap-4 mb-8">
					<div className="flex items-center gap-3">
						<SectionTitle size="lg">Analytics</SectionTitle>
					</div>
				</div>

				{error && <p className="text-red-600 mb-8">{error}</p>}

				{loading ? (
					<div className="flex flex-col gap-8">
						<UserEngagementSkeleton />
						<FeaturePopularitySkeleton />
						<AccessibilityMetricsSkeleton />
						<PerformanceMetricsSkeleton />
					</div>
				) : (
					userEngagement &&
					featurePopularity &&
					accessibilityCompliance &&
					performanceMetrics && (
						<div className="flex flex-col gap-8">
							<UserEngagement
								userEngagement={userEngagement}
								dailyTrendData={dailyTrendData}
							/>

							<FeaturePopularity
								featurePopularity={featurePopularity}
								COLORS={COLORS}
							/>

							<AccessibilityMetrics
								accessibilityCompliance={accessibilityCompliance}
								COLORS={COLORS}
							/>

							<PerformanceMetrics performanceMetrics={performanceMetrics} />
						</div>
					)
				)}
				<div className="mt-12 pl-4 border-l-4 border-emerald-200 py-1">
					<p className="text-sm text-gray-600 italic leading-relaxed">
						<span className="font-semibold not-italic text-emerald-800">
							A Note on Metrics:
						</span>{" "}
						To maintain statistical significance during low traffic periods,
						synthetic traffic is periodically injected to validate latency
						percentiles and error-handling paths. All metrics remain anonymized.
					</p>
				</div>
			</div>
		</MainLayout>
	);
}
