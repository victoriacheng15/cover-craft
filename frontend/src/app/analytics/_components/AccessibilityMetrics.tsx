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
import { Card, KPICard, SectionTitle } from "@/components/ui";

interface AccessibilityMetricsProps {
	accessibilityCompliance: AccessibilityComplianceType;
	COLORS: string[];
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
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
				{/* WCAG Distribution */}
				<Card>
					<SectionTitle as="h4" size="sm" className="mb-4">
						WCAG Level Distribution
					</SectionTitle>
					<ResponsiveContainer width="100%" height={300}>
						<PieChart>
							<Pie
								data={accessibilityCompliance.wcagDistribution}
								dataKey="count"
								nameKey="level"
								cx="50%"
								cy="50%"
								outerRadius={100}
								label
							>
								{accessibilityCompliance.wcagDistribution.map((entry, idx) => (
									<Cell
										key={`cell-wcag-${entry.level}`}
										fill={COLORS[idx % COLORS.length]}
									/>
								))}
							</Pie>
							<Tooltip />
							<Legend />
						</PieChart>
					</ResponsiveContainer>
				</Card>

				{/* Contrast Ratio Stats */}
				<Card>
					<SectionTitle as="h4" size="sm" className="mb-4">
						Contrast Ratio Statistics
					</SectionTitle>
					<div className="grid grid-cols-1 gap-4">
						{[
							{
								title: "Average Contrast Ratio",
								value:
									accessibilityCompliance.contrastStats.avgContrastRatio.toFixed(
										2,
									),
								color: "blue" as const,
							},
						].map((card) => (
							<KPICard key={card.title} {...card} />
						))}
					</div>
				</Card>
			</div>

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
						{Object.keys(accessibilityCompliance.wcagTrend[0] || {})
							.filter((key) => key !== "date")
							.map((level, idx) => (
								<Line
									key={`line-${level}`}
									type="monotone"
									dataKey={level}
									stroke={COLORS[idx % COLORS.length]}
									strokeWidth={2}
									dot={{ r: 3 }}
								/>
							))}
					</LineChart>
				</ResponsiveContainer>
			</Card>
		</section>
	);
}
