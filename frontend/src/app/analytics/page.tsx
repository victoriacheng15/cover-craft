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
import { SectionTitle } from "@/components/ui";
import { useAnalytics } from "@/hooks";

export default function AnalyticsPage() {
	const { data, loading, error, COLORS, dailyTrendData } = useAnalytics();

	return (
		<MainLayout>
			<div className="max-w-6xl mx-auto">
				<SectionTitle size="lg">Analytics</SectionTitle>
				{loading && <p>Loading analytics...</p>}
				{error && <p className="text-red-600">{error}</p>}
				{data && (
					<div className="flex flex-col gap-8">
						{/* User Engagement Section */}
						<section>
							<SectionTitle as="h3" size="md">
								User Engagement
							</SectionTitle>
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
								<div className="bg-blue-50 rounded-lg p-4">
									<p className="text-sm text-gray-600">Covers Generated</p>
									<p className="text-3xl font-bold text-blue-600">
										{data.userEngagement.totalCoversGenerated}
									</p>
								</div>
								<div className="bg-green-50 rounded-lg p-4">
									<p className="text-sm text-gray-600">Downloads</p>
									<p className="text-3xl font-bold text-green-600">
										{data.userEngagement.totalDownloads}
									</p>
								</div>
								<div className="bg-purple-50 rounded-lg p-4">
									<p className="text-sm text-gray-600">Download Rate</p>
									<p className="text-3xl font-bold text-purple-600">
										{data.userEngagement.downloadRate.toFixed(1)}%
									</p>
								</div>
							</div>

							{/* Daily Trend */}
							<div className="w-full min-w-0 bg-slate-100 rounded-lg p-4">
								<h4 className="text-sm font-semibold mb-4">
									Daily Trend (Last 7 Days)
								</h4>
								<ResponsiveContainer width="100%" height={250} minWidth={0}>
									<LineChart
										data={dailyTrendData}
										margin={{ top: 16, right: 16, left: 0, bottom: 0 }}
									>
										<CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
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
							</div>
						</section>

						{/* Feature Popularity Section */}
						<section>
							<SectionTitle as="h3" size="md">
								Feature Popularity
							</SectionTitle>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
								{/* Top Fonts */}
								<div className="bg-slate-100 rounded-lg p-4">
									<h4 className="text-sm font-semibold mb-4">Top Fonts</h4>
									<ResponsiveContainer width="100%" height={300}>
										<PieChart>
											<Pie
												data={data.featurePopularity.topFonts}
												dataKey="count"
												nameKey="font"
												cx="50%"
												cy="50%"
												outerRadius={100}
												label
											>
												{data.featurePopularity.topFonts.map((entry, idx) => (
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
								</div>

								{/* Top Sizes */}
								<div className="bg-slate-100 rounded-lg p-4">
									<h4 className="text-sm font-semibold mb-4">Top Sizes</h4>
									<ResponsiveContainer width="100%" height={300}>
										<PieChart>
											<Pie
												data={data.featurePopularity.topSizes}
												dataKey="count"
												nameKey="size"
												cx="50%"
												cy="50%"
												outerRadius={100}
												label
											>
												{data.featurePopularity.topSizes.map((entry, idx) => (
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
								</div>
							</div>

							{/* Title Length Stats */}
							<div className="mt-6 bg-slate-100 rounded-lg p-4">
								<h4 className="text-sm font-semibold mb-4">
									Title Length Statistics
								</h4>
								<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
									<div>
										<p className="text-xs text-gray-600">Average</p>
										<p className="text-2xl font-bold">
											{data.featurePopularity.titleLengthStats.avgTitleLength.toFixed(
												1,
											)}
										</p>
									</div>
									<div>
										<p className="text-xs text-gray-600">Minimum</p>
										<p className="text-2xl font-bold">
											{data.featurePopularity.titleLengthStats.minTitleLength}
										</p>
									</div>
									<div>
										<p className="text-xs text-gray-600">Maximum</p>
										<p className="text-2xl font-bold">
											{data.featurePopularity.titleLengthStats.maxTitleLength}
										</p>
									</div>
								</div>
								<div className="mt-4 p-3 bg-white rounded">
									<p className="text-sm">
										<span className="font-semibold">
											{data.featurePopularity.subtitleUsagePercent.toFixed(1)}%
										</span>{" "}
										of covers include subtitles
									</p>
								</div>
							</div>
						</section>

						{/* Accessibility Compliance Section */}
						<section>
							<SectionTitle as="h3" size="md">
								Accessibility Compliance
							</SectionTitle>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
								{/* WCAG Distribution */}
								<div className="bg-slate-100 rounded-lg p-4">
									<h4 className="text-sm font-semibold mb-4">
										WCAG Level Distribution
									</h4>
									<ResponsiveContainer width="100%" height={300}>
										<PieChart>
											<Pie
												data={data.accessibilityCompliance.wcagDistribution}
												dataKey="count"
												nameKey="level"
												cx="50%"
												cy="50%"
												outerRadius={100}
												label
											>
												{data.accessibilityCompliance.wcagDistribution.map(
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

								{/* Contrast Ratio Stats */}
								<div className="bg-slate-100 rounded-lg p-4">
									<h4 className="text-sm font-semibold mb-4">
										Contrast Ratio Statistics
									</h4>
									<div className="space-y-4 h-full flex flex-col justify-center">
										<div className="bg-white rounded p-3">
											<p className="text-xs text-gray-600">
												Average Contrast Ratio
											</p>
											<p className="text-3xl font-bold text-blue-600">
												{data.accessibilityCompliance.contrastStats.avgContrastRatio.toFixed(
													2,
												)}
											</p>
										</div>
										<div className="bg-white rounded p-3">
											<p className="text-xs text-gray-600">
												Failure Rate (WCAG FAIL)
											</p>
											<p className="text-3xl font-bold text-red-600">
												{data.accessibilityCompliance.wcagFailurePercent.toFixed(
													1,
												)}
												%
											</p>
										</div>
									</div>
								</div>
							</div>

							{/* WCAG Trend */}
							<div className="mt-6 w-full min-w-0 bg-slate-100 rounded-lg p-4">
								<h4 className="text-sm font-semibold mb-4">
									WCAG Trend (Last 30 Days)
								</h4>
								<ResponsiveContainer width="100%" height={300} minWidth={0}>
									<LineChart
										data={data.accessibilityCompliance.wcagTrend}
										margin={{ top: 16, right: 16, left: 0, bottom: 0 }}
									>
										<CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
										<XAxis dataKey="date" />
										<YAxis allowDecimals={false} />
										<Tooltip />
										<Legend />
										{Object.keys(
											data.accessibilityCompliance.wcagTrend[0] || {},
										)
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
							</div>
						</section>
					</div>
				)}
			</div>
		</MainLayout>
	);
}
