import type { AccessibilityCompliance as AccessibilityComplianceType } from "@cover-craft/shared";
import {
	CartesianGrid,
	Cell,
	Legend,
	Line,
	LineChart,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Card, KPICard, SectionTitle, Skeleton } from "@/components/ui";

interface AccessibilityMetricsProps {
	accessibilityCompliance: AccessibilityComplianceType;
	COLORS: string[];
}

export function AccessibilityMetricsSkeleton() {
	return (
		<section>
			<SectionTitle as="h3" size="md">
				Accessibility Compliance
			</SectionTitle>
			<Card className="mb-6">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
					<div className="h-[250px] w-full bg-gray-100 rounded-lg animate-pulse" />
					<div className="grid grid-cols-1 gap-3 w-full">
						{["a1", "a2", "a3"].map((id) => (
							<Skeleton key={`acc-kpi-${id}`} className="h-20 w-full" />
						))}
					</div>
				</div>
			</Card>
			<Card className="h-[350px]" />
		</section>
	);
}

export function AccessibilityMetrics({
	accessibilityCompliance,
	COLORS,
}: AccessibilityMetricsProps) {
	return (
		<section>
			<SectionTitle as="h3" size="md">
				Accessibility Compliance
			</SectionTitle>
			<Card className="mb-6">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
					{/* WCAG Distribution */}
					<div className="flex flex-col h-full">
						<SectionTitle
							as="h4"
							size="sm"
							className="mb-6 text-center md:text-left"
						>
							WCAG Level Distribution
						</SectionTitle>
						<div className="flex-1 flex items-center justify-center">
							<ResponsiveContainer width="100%" height={250}>
								<PieChart>
									<Pie
										data={accessibilityCompliance.wcagDistribution}
										dataKey="count"
										nameKey="level"
										cx="50%"
										cy="50%"
										outerRadius={80}
										label
									>
										{accessibilityCompliance.wcagDistribution.map(
											(entry, idx) => (
												<Cell
													key={`cell-wcag-${entry.level}`}
													fill={COLORS[idx % COLORS.length]}
												/>
											),
										)}
									</Pie>
									<Tooltip />
									<Legend />
								</PieChart>
							</ResponsiveContainer>
						</div>
					</div>

					{/* Contrast Ratio Stats */}
					<div className="flex flex-col h-full">
						<SectionTitle as="h4" size="sm" className="mb-6">
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

			{/* WCAG Trend */}
			<Card className="mt-6 w-full min-w-0">
				<SectionTitle as="h4" size="sm" className="mb-4">
					WCAG Trend (Last 30 Days)
				</SectionTitle>
				<ResponsiveContainer width="100%" height={300} minWidth={0}>
					<LineChart
						data={accessibilityCompliance.wcagTrend}
						margin={{ top: 16, right: 16, left: 0, bottom: 0 }}
					>
						<CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
						<XAxis dataKey="date" />
						<YAxis allowDecimals={false} />
						<Tooltip />
						<Legend />
						{["AAA", "AA"].map((level, idx) => (
							<Line
								key={`line-${level}`}
								type="monotone"
								dataKey={level}
								stroke={COLORS[idx % COLORS.length]}
								strokeWidth={2}
								dot={{ r: 3 }}
								connectNulls
							/>
						))}
					</LineChart>
				</ResponsiveContainer>
			</Card>
		</section>
	);
}
