import type { AccessibilityCompliance as AccessibilityComplianceType } from "@cover-craft/shared";
import { Card, KPICard, SectionTitle, Skeleton } from "@/components/ui";

interface AccessibilityMetricsProps {
	accessibilityCompliance: AccessibilityComplianceType;
	COLORS?: string[];
}

export function AccessibilityMetricsSkeleton() {
	return (
		<section>
			<SectionTitle as="h3" size="md">
				Accessibility Compliance
			</SectionTitle>
			<Card className="mb-6">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
					<div className="h-62.5 w-full bg-gray-100 rounded-lg animate-pulse" />
					<div className="grid grid-cols-1 gap-3 w-full">
						{["a1", "a2", "a3"].map((id) => (
							<Skeleton key={`acc-kpi-${id}`} className="h-20 w-full" />
						))}
					</div>
				</div>
			</Card>
		</section>
	);
}

export function AccessibilityMetrics({
	accessibilityCompliance,
}: AccessibilityMetricsProps) {
	const distribution = accessibilityCompliance.wcagDistribution || [];
	const aaaCount = distribution.find((d) => d.level === "AAA")?.count ?? 0;
	const aaCount = distribution.find((d) => d.level === "AA")?.count ?? 0;
	const totalCompliant = aaaCount + aaCount;

	const aaaPct = totalCompliant > 0 ? (aaaCount / totalCompliant) * 100 : 0;
	const aaPct = totalCompliant > 0 ? (aaCount / totalCompliant) * 100 : 0;

	const tiers = [
		{
			level: "Level AAA",
			criteria: "Enhanced (≥ 7.0:1)",
			count: aaaCount,
			pct: aaaPct,
			colorBg: "bg-emerald-500",
		},
		{
			level: "Level AA",
			criteria: "Standard (≥ 4.5:1)",
			count: aaCount,
			pct: aaPct,
			colorBg: "bg-blue-500",
		},
	];

	return (
		<section>
			<SectionTitle as="h3" size="md">
				Accessibility Compliance
			</SectionTitle>
			<Card className="mb-6 w-full min-w-0">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
					{/* WCAG Compliance Meter */}
					<div className="flex flex-col h-full w-full min-w-0 justify-between">
						<div>
							<SectionTitle
								as="h4"
								size="sm"
								className="mb-4 text-center md:text-left"
							>
								WCAG Level Distribution
							</SectionTitle>

							<div className="flex flex-col gap-6 py-2">
								{/* Segmented Proportional Bar */}
								<div className="flex h-5 w-full overflow-hidden rounded-full bg-gray-100 p-0.5 shadow-inner">
									{totalCompliant === 0 ? (
										<div className="w-full h-full rounded-full bg-gray-200" />
									) : (
										<>
											{aaaPct > 0 && (
												<div
													style={{ width: `${aaaPct}%` }}
													className="bg-emerald-500 transition-all duration-300 first:rounded-l-full last:rounded-r-full"
													title={`Level AAA: ${aaaCount} (${aaaPct.toFixed(1)}%)`}
												/>
											)}
											{aaPct > 0 && (
												<div
													style={{ width: `${aaPct}%` }}
													className="bg-blue-500 transition-all duration-300 first:rounded-l-full last:rounded-r-full"
													title={`Level AA: ${aaCount} (${aaPct.toFixed(1)}%)`}
												/>
											)}
										</>
									)}
								</div>

								{/* Tier Breakdown Rows */}
								<div className="flex flex-col gap-3">
									{tiers.map((tier) => (
										<div
											key={tier.level}
											className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-3 shadow-xs"
										>
											<div className="flex items-center gap-2.5">
												<span
													className={`h-3 w-3 rounded-full ${tier.colorBg}`}
												/>
												<div className="flex flex-col">
													<span className="text-sm font-semibold text-gray-800">
														{tier.level}
													</span>
													<span className="text-xs text-gray-400">
														{tier.criteria}
													</span>
												</div>
											</div>
											<div className="flex items-center gap-3">
												<span className="text-sm font-bold text-gray-900">
													{tier.count}
												</span>
												<span className="min-w-12 text-right text-xs font-semibold text-gray-500">
													{tier.pct.toFixed(1)}%
												</span>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>

						<div className="mt-4 border-t border-gray-100 pt-2.5">
							<p className="text-xs text-gray-500">
								Total evaluated assets:{" "}
								<span className="font-semibold text-gray-800">
									{totalCompliant}
								</span>
							</p>
						</div>
					</div>

					{/* Contrast Ratio Stats */}
					<div className="flex flex-col h-full w-full min-w-0">
						<SectionTitle as="h4" size="sm" className="mb-4">
							Contrast Ratio Statistics
						</SectionTitle>
						<div className="grid grid-cols-1 gap-3">
							{[
								{
									title: "Average Contrast",
									value:
										accessibilityCompliance.contrastStats.avgContrastRatio.toFixed(
											2,
										),
									color: "blue" as const,
								},
								{
									title: "Minimum Contrast",
									value:
										accessibilityCompliance.contrastStats.minContrastRatio.toFixed(
											2,
										),
									color: "white" as const,
								},
								{
									title: "Maximum Contrast",
									value:
										accessibilityCompliance.contrastStats.maxContrastRatio.toFixed(
											2,
										),
									color: "white" as const,
								},
							].map((card) => (
								<KPICard key={card.title} {...card} />
							))}
						</div>
					</div>
				</div>
			</Card>
		</section>
	);
}
