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

export function UserEngagementSkeleton() {
	return (
		<section>
			<SectionTitle as="h3" size="md">
				User Engagement
			</SectionTitle>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
				{["e1", "e2", "e3", "e4"].map((id) => (
					<Card key={`kpi-skeleton-${id}`} className="h-24" />
				))}
			</div>
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card className="h-75" />
				<Card className="h-75" />
			</div>
		</section>
	);
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
			{(() => {
				const dailyData =
					dailyTrendData && dailyTrendData.length > 0
						? dailyTrendData
						: Array.from({ length: 7 }, (_, i) => {
								const d = new Date();
								d.setDate(d.getDate() - (6 - i));
								return {
									date: d.toLocaleDateString("default", {
										month: "short",
										day: "numeric",
									}),
									count: 0,
								};
							});

				const hourlyData = (() => {
					const hours = Array.from({ length: 24 }, (_, i) => ({
						hour: i,
						count: 0,
					}));
					for (const item of userEngagement.hourlyTrend || []) {
						if (item.hour >= 0 && item.hour < 24) {
							hours[item.hour].count = item.count;
						}
					}
					return hours;
				})();

				return (
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Daily Trend */}
						<Card className="w-full min-w-0">
							<SectionTitle as="h4" size="sm" className="mb-4">
								Successful Generations (Daily)
							</SectionTitle>
							<ResponsiveContainer width="100%" height={250} minWidth={0}>
								<LineChart
									data={dailyData}
									margin={{ top: 16, right: 16, left: 0, bottom: 0 }}
								>
									<CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
									<XAxis dataKey="date" />
									<YAxis
										allowDecimals={false}
										domain={[0, (dataMax: number) => Math.max(dataMax || 0, 5)]}
									/>
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
									data={hourlyData}
									margin={{ top: 16, right: 16, left: 0, bottom: 0 }}
								>
									<CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
									<XAxis
										dataKey="hour"
										ticks={[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22]}
										interval={0}
										label={{ value: "Hour", position: "bottom" }}
									/>
									<YAxis
										allowDecimals={false}
										domain={[0, (dataMax: number) => Math.max(dataMax || 0, 5)]}
									/>
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
				);
			})()}
		</section>
	);
}
