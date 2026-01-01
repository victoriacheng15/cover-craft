"use client";

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
import MainLayout from "@/components/layout/MainLayout";
import { Card, KPICard, SectionTitle } from "@/components/ui";
import { useAnalytics } from "@/hooks";
import {
	SUBTITLE_LENGTH_THRESHOLDS,
	TITLE_LENGTH_THRESHOLDS,
} from "@/shared/validators";

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
				{loading && <p>Loading analytics...</p>}
				{error && <p className="text-red-600">{error}</p>}
				{userEngagement &&
					featurePopularity &&
					accessibilityCompliance &&
					performanceMetrics && (
						<div className="flex flex-col gap-8">
							{/* User Engagement Section */}
							<section>
								<SectionTitle as="h3" size="md">
									User Engagement
								</SectionTitle>
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
									{[
										{
											title: "Covers Generated",
											value: userEngagement.totalCoversGenerated,
											color: "blue" as const,
										},
										{
											title: "Images Generated",
											value: userEngagement.totalImagesGenerated,
											color: "green" as const,
										},
										{
											title: "Success Rate",
											value: userEngagement.generationSuccessRate,
											color: "purple" as const,
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
											Daily Trend (Last 30 Days)
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
													name="Covers Generated"
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
													name="Generation Count"
												/>
											</LineChart>
										</ResponsiveContainer>
									</Card>
								</div>
							</section>

							{/* Feature Popularity Section */}
							<section>
								<SectionTitle as="h3" size="md">
									Feature Popularity
								</SectionTitle>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-6">
									{/* Top Fonts */}
									<Card>
										<SectionTitle as="h4" size="sm" className="mb-4">
											Top Fonts
										</SectionTitle>
										<ResponsiveContainer width="100%" height={300}>
											<PieChart>
												<Pie
													data={featurePopularity.topFonts}
													dataKey="count"
													nameKey="font"
													cx="50%"
													cy="50%"
													outerRadius={100}
													label
												>
													{featurePopularity.topFonts.map((entry, idx) => (
														<Cell
															key={`cell-font-${entry.font}`}
															fill={COLORS[idx % COLORS.length]}
														/>
													))}
												</Pie>
												<Tooltip />
												<Legend />
											</PieChart>
										</ResponsiveContainer>
									</Card>

									{/* Top Sizes */}
									<Card>
										<SectionTitle as="h4" size="sm" className="mb-4">
											Top Sizes
										</SectionTitle>
										<ResponsiveContainer width="100%" height={300}>
											<PieChart>
												<Pie
													data={featurePopularity.topSizes}
													dataKey="count"
													nameKey="size"
													cx="50%"
													cy="50%"
													outerRadius={100}
													label
												>
													{featurePopularity.topSizes.map((entry, idx) => (
														<Cell
															key={`cell-size-${entry.size}`}
															fill={COLORS[idx % COLORS.length]}
														/>
													))}
												</Pie>
												<Tooltip />
												<Legend />
											</PieChart>
										</ResponsiveContainer>
									</Card>
								</div>

								{/* Title Length Distribution */}
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-6">
									<Card>
										<SectionTitle as="h4" size="sm" className="mb-4">
											Title Length Distribution
										</SectionTitle>
										<ResponsiveContainer width="100%" height={300}>
											<PieChart>
												<Pie
													data={[
														{
															name: `Short (0-${TITLE_LENGTH_THRESHOLDS.SHORT_MAX})`,
															value:
																featurePopularity.titleLengthDistribution.short,
														},
														{
															name: `Medium (${TITLE_LENGTH_THRESHOLDS.SHORT_MAX + 1}-${TITLE_LENGTH_THRESHOLDS.MEDIUM_MAX})`,
															value:
																featurePopularity.titleLengthDistribution
																	.medium,
														},
														{
															name: `Long (${TITLE_LENGTH_THRESHOLDS.MEDIUM_MAX + 1}+)`,
															value:
																featurePopularity.titleLengthDistribution.long,
														},
													]}
													dataKey="value"
													nameKey="name"
													cx="50%"
													cy="50%"
													outerRadius={100}
													label
												>
													{[0, 1, 2].map((idx) => (
														<Cell
															key={`cell-title-${idx}`}
															fill={COLORS[idx % COLORS.length]}
														/>
													))}
												</Pie>
												<Tooltip />
												<Legend />
											</PieChart>
										</ResponsiveContainer>
									</Card>

									{/* Subtitle Distribution */}
									<Card>
										<SectionTitle as="h4" size="sm" className="mb-4">
											Subtitle Usage Distribution
										</SectionTitle>
										<ResponsiveContainer width="100%" height={300}>
											<PieChart>
												<Pie
													data={[
														{
															name: "None (0)",
															value:
																featurePopularity.subtitleUsageDistribution
																	.none,
														},
														{
															name: `Short (1-${SUBTITLE_LENGTH_THRESHOLDS.SHORT_MAX})`,
															value:
																featurePopularity.subtitleUsageDistribution
																	.short,
														},
														{
															name: `Medium (${SUBTITLE_LENGTH_THRESHOLDS.SHORT_MAX + 1}-${SUBTITLE_LENGTH_THRESHOLDS.MEDIUM_MAX})`,
															value:
																featurePopularity.subtitleUsageDistribution
																	.medium,
														},
														{
															name: `Long (${SUBTITLE_LENGTH_THRESHOLDS.MEDIUM_MAX + 1}+)`,
															value:
																featurePopularity.subtitleUsageDistribution
																	.long,
														},
													]}
													dataKey="value"
													nameKey="name"
													cx="50%"
													cy="50%"
													outerRadius={100}
													label
												>
													{[0, 1, 2, 3].map((idx) => (
														<Cell
															key={`cell-subtitle-${idx}`}
															fill={COLORS[idx % COLORS.length]}
														/>
													))}
												</Pie>
												<Tooltip />
												<Legend />
											</PieChart>
										</ResponsiveContainer>
									</Card>
								</div>

								{/* Subtitle Trend Over Time */}
								<div className="mb-6">
									<Card>
										<SectionTitle as="h4" size="sm" className="mb-4">
											Subtitle Adoption Trend (Weekly)
										</SectionTitle>
										<ResponsiveContainer width="100%" height={250}>
											<LineChart
												data={featurePopularity.subtitleTrendOverTime}
												margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
											>
												<CartesianGrid stroke="#e2e8f0" />
												<XAxis dataKey="week" />
												<YAxis
													label={{
														value: "Adoption %",
														angle: -90,
														position: "insideLeft",
													}}
												/>
												<Tooltip
													formatter={(value) =>
														typeof value === "number"
															? `${value.toFixed(1)}%`
															: value
													}
												/>
												<Legend />
												<Line
													type="monotone"
													dataKey="percentage"
													stroke="#ec4899"
													dot={{ fill: "#ec4899", r: 4 }}
													name="Subtitle Adoption Rate"
												/>
											</LineChart>
										</ResponsiveContainer>
									</Card>
								</div>

								{/* Title Length Stats */}
								<Card className="mt-6">
									<SectionTitle as="h4" size="sm" className="mb-4">
										Title Length Statistics
									</SectionTitle>
									<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
										{[
											{
												title: "Average",
												value:
													featurePopularity.titleLengthStats.avgTitleLength,
												color: "blue" as const,
											},
											{
												title: "Minimum",
												value:
													featurePopularity.titleLengthStats.minTitleLength,
												color: "green" as const,
											},
											{
												title: "Maximum",
												value:
													featurePopularity.titleLengthStats.maxTitleLength,
												color: "purple" as const,
											},
										].map((card) => (
											<KPICard key={card.title} {...card} />
										))}
									</div>
									<div className="p-3 bg-white rounded-xl border border-gray-100">
										<p className="text-sm">
											<span className="font-semibold text-emerald-600">
												{featurePopularity.subtitleUsagePercent.toFixed(1)}%
											</span>{" "}
											of covers include subtitles
										</p>
									</div>
								</Card>
							</section>

							{/* Accessibility Compliance Section */}
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
												{
													title: "Failure Rate (WCAG FAIL)",
													value: accessibilityCompliance.wcagFailurePercent,
													color: "red" as const,
													suffix: "%",
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

							{/* Performance Metrics Section */}
							<section>
								<SectionTitle as="h3" size="md">
									Performance Metrics
								</SectionTitle>

								{/* Key Performance Indicators */}
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
									{[
										{
											title: "Avg Backend Duration",
											value:
												performanceMetrics.backendPerformance
													.avgBackendDuration,
											color: "white" as const,
											suffix: "ms",
										},
										{
											title: "Avg Client Duration",
											value:
												performanceMetrics.clientPerformance.avgClientDuration,
											color: "white" as const,
											suffix: "ms",
										},
										{
											title: "Network Latency",
											value:
												performanceMetrics.networkLatency.avgNetworkLatency,
											color: "white" as const,
											suffix: "ms",
										},
										{
											title: "P95 Backend Duration",
											value:
												performanceMetrics.backendPerformance
													.p95BackendDuration,
											color: "white" as const,
											suffix: "ms",
										},
									].map((card) => (
										<KPICard key={card.title} {...card} />
									))}
								</div>

								{/* Performance Trends */}
								<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
									{/* Backend Duration Trend */}
									<Card>
										<SectionTitle as="h4" size="sm" className="mb-4">
											Backend Duration Trend (Percentiles)
										</SectionTitle>
										<ResponsiveContainer width="100%" height={300}>
											<LineChart
												data={
													performanceMetrics.backendPerformance
														.backendDurationTrend
												}
												margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
											>
												<CartesianGrid stroke="#e2e8f0" />
												<XAxis dataKey="date" />
												<YAxis
													label={{
														value: "Duration (ms)",
														angle: -90,
														position: "insideLeft",
													}}
												/>
												<Tooltip />
												<Legend />
												<Line
													type="monotone"
													dataKey="p50"
													stroke="#3b82f6"
													name="P50"
												/>
												<Line
													type="monotone"
													dataKey="p95"
													stroke="#f59e0b"
													name="P95"
												/>
												<Line
													type="monotone"
													dataKey="p99"
													stroke="#ef4444"
													name="P99"
												/>
											</LineChart>
										</ResponsiveContainer>
									</Card>

									{/* Client Duration Trend */}
									<Card>
										<SectionTitle as="h4" size="sm" className="mb-4">
											Client Duration Trend (Percentiles)
										</SectionTitle>
										<ResponsiveContainer width="100%" height={300}>
											<LineChart
												data={
													performanceMetrics.clientPerformance
														.clientDurationTrend
												}
												margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
											>
												<CartesianGrid stroke="#e2e8f0" />
												<XAxis dataKey="date" />
												<YAxis
													label={{
														value: "Duration (ms)",
														angle: -90,
														position: "insideLeft",
													}}
												/>
												<Tooltip />
												<Legend />
												<Line
													type="monotone"
													dataKey="p50"
													stroke="#10b981"
													name="P50"
												/>
												<Line
													type="monotone"
													dataKey="p95"
													stroke="#8b5cf6"
													name="P95"
												/>
												<Line
													type="monotone"
													dataKey="p99"
													stroke="#ec4899"
													name="P99"
												/>
											</LineChart>
										</ResponsiveContainer>
									</Card>
								</div>

								{/* Performance by Size */}
								<Card>
									<SectionTitle as="h4" size="sm" className="mb-4">
										Performance by Image Size
									</SectionTitle>
									<div className="overflow-x-auto">
										<table className="w-full text-sm">
											<thead>
												<tr className="border-b border-gray-100">
													<th className="text-left p-2">Size</th>
													<th className="text-right p-2">Avg Backend (ms)</th>
													<th className="text-right p-2">Avg Client (ms)</th>
													<th className="text-right p-2">Avg Total (ms)</th>
												</tr>
											</thead>
											<tbody>
												{performanceMetrics.performanceBySize.map(
													(sizeMetric, idx) => (
														<tr
															key={`perf-size-${sizeMetric.size}`}
															className={
																idx % 2 === 0 ? "bg-white" : "bg-emerald-50/30"
															}
														>
															<td className="p-2 font-medium">
																{sizeMetric.size}
															</td>
															<td className="text-right p-2">
																{sizeMetric.avgBackendDuration?.toFixed(0) ||
																	"-"}
															</td>
															<td className="text-right p-2">
																{sizeMetric.avgClientDuration?.toFixed(0) ||
																	"-"}
															</td>
															<td className="text-right p-2 font-semibold text-emerald-700">
																{sizeMetric.avgBackendDuration &&
																sizeMetric.avgClientDuration
																	? (
																			sizeMetric.avgBackendDuration +
																			sizeMetric.avgClientDuration
																		).toFixed(0)
																	: "-"}
															</td>
														</tr>
													),
												)}
											</tbody>
										</table>
									</div>
								</Card>
							</section>
						</div>
					)}
				<div className="mt-12 pl-4 border-l-4 border-emerald-200 py-1">
					<p className="text-sm text-gray-600 italic leading-relaxed">
						<span className="font-semibold not-italic text-emerald-800">
							A Note on Metrics:
						</span>{" "}
						To keep metrics meaningful during low traffic, I occasionally send
						synthetic requests from my homelab—mimicking real usage (including
						errors) to validate latency percentiles. All data is anonymized and
						never tied to individuals.
					</p>
				</div>
			</div>
		</MainLayout>
	);
}
