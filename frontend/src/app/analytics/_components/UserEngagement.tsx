import type { UserEngagement as UserEngagementType } from "@cover-craft/shared";
import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Card, KPICard, SectionTitle } from "@/components/ui";

interface UserEngagementProps {
	userEngagement: UserEngagementType;
	dailyTrendData: { date: string; count: number }[];
}

export function UserEngagement({
	userEngagement,
	dailyTrendData,
}: UserEngagementProps) {
	return (
		<section>
			<SectionTitle as="h3" size="md">
				User Engagement
			</SectionTitle>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
				{[
					{
						title: "Generation Attempts",
						value: userEngagement.uiGenerationAttempts,
						color: "blue" as const,
					},
					{
						title: "Successful Generations",
						value: userEngagement.totalSuccessfulGenerations,
						color: "green" as const,
					},
					{
						title: "UI Usage",
						value: userEngagement.uiUsagePercent,
						color: "orange" as const,
						suffix: "%",
					},
					{
						title: "API Usage",
						value: userEngagement.apiUsagePercent,
						color: "orange" as const,
						suffix: "%",
					},
					{
						title: "Downloads",
						value: userEngagement.totalDownloads,
						color: "indigo" as const,
					},
					{
						title: "Download Rate",
						value: userEngagement.downloadRate,
						color: "pink" as const,
						suffix: "%",
					},
				].map((card) => (
					<KPICard key={card.title} {...card} />
				))}
			</div>
			{/* Daily & Hourly Trends */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Daily Trend */}
				<Card className="w-full min-w-0">
					<SectionTitle as="h4" size="sm" className="mb-4">
						Successful Generations (Daily)
					</SectionTitle>
					<ResponsiveContainer width="100%" height={250} minWidth={0}>
						<LineChart
							data={dailyTrendData}
							margin={{ top: 16, right: 16, left: 0, bottom: 0 }}
						>
							<CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
							<XAxis dataKey="date" />
							<YAxis allowDecimals={false} />
							<Tooltip />
							<Line
								type="monotone"
								dataKey="count"
								stroke="#3b82f6"
								strokeWidth={2}
								dot={{ r: 4 }}
								name="Successful Generations"
							/>
						</LineChart>
					</ResponsiveContainer>
				</Card>

				{/* Hourly Trend */}
				<Card className="w-full min-w-0">
					<SectionTitle as="h4" size="sm" className="mb-4">
						Peak Usage Times (By Hour)
					</SectionTitle>
					<ResponsiveContainer width="100%" height={250} minWidth={0}>
						<LineChart
							data={userEngagement.hourlyTrend}
							margin={{ top: 16, right: 16, left: 0, bottom: 0 }}
						>
							<CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
							<XAxis
								dataKey="hour"
								label={{ value: "Hour", position: "bottom" }}
							/>
							<YAxis allowDecimals={false} />
							<Tooltip />
							<Line
								type="monotone"
								dataKey="count"
								stroke="#8b5cf6"
								strokeWidth={2}
								dot={{ r: 4 }}
								name="Successful Generations"
							/>
						</LineChart>
					</ResponsiveContainer>
				</Card>
			</div>
		</section>
	);
}
