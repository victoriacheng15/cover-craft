import {
	type FeaturePopularity as FeaturePopularityType,
	SUBTITLE_LENGTH_THRESHOLDS,
	TITLE_LENGTH_THRESHOLDS,
} from "@cover-craft/shared";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Card, KPICard, SectionTitle } from "@/components/ui";

interface FeaturePopularityProps {
	featurePopularity: FeaturePopularityType;
	COLORS: string[];
}

export function FeaturePopularitySkeleton() {
	return (
		<section>
			<SectionTitle as="h3" size="md">
				Feature Popularity
			</SectionTitle>
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-6">
				<Card className="h-87.5" />
				<Card className="h-87.5" />
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-6">
				<Card className="h-87.5" />
				<Card className="h-87.5" />
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-6">
				<Card className="h-87.5" />
				<Card className="h-87.5" />
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-6">
				<Card className="h-87.5" />
				<Card className="h-87.5" />
			</div>
			<Card className="h-48" />
		</section>
	);
}

const renderPercentLabel = ({ percent }: { percent?: number }) =>
	percent && percent > 0 ? `${(percent * 100).toFixed(0)}%` : "";

export function FeaturePopularity({
	featurePopularity,
	COLORS,
}: FeaturePopularityProps) {
	return (
		<section>
			<SectionTitle as="h3" size="md">
				Feature Popularity
			</SectionTitle>
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-6">
				{/* Top Fonts */}
				<Card className="w-full min-w-0">
					<SectionTitle as="h4" size="sm" className="mb-4">
						Top Fonts
					</SectionTitle>
					{featurePopularity.topFonts.every((e) => e.count === 0) ? (
						<div className="flex h-[300px] items-center justify-center text-sm text-gray-400">
							No font data recorded yet
						</div>
					) : (
						<ResponsiveContainer width="100%" height={300} minWidth={0}>
							<BarChart
								layout="vertical"
								data={featurePopularity.topFonts}
								margin={{ top: 16, right: 16, left: 16, bottom: 0 }}
							>
								<CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
								<XAxis type="number" allowDecimals={false} />
								<YAxis
									type="category"
									dataKey="font"
									width={105}
									tick={{ fontSize: 12 }}
								/>
								<Tooltip />
								<Bar
									dataKey="count"
									fill="#6366f1"
									radius={[0, 6, 6, 0]}
									name="Generations"
								/>
							</BarChart>
						</ResponsiveContainer>
					)}
				</Card>

				{/* Top Sizes */}
				<Card className="w-full min-w-0 flex flex-col justify-between">
					<div>
						<SectionTitle as="h4" size="sm" className="mb-4">
							Top Sizes
						</SectionTitle>
						{(() => {
							const totalSizes = featurePopularity.topSizes.reduce(
								(acc, curr) => acc + curr.count,
								0,
							);

							if (totalSizes === 0) {
								return (
									<div className="flex h-[300px] items-center justify-center text-sm text-gray-400">
										No size data recorded yet
									</div>
								);
							}

							return (
								<div className="flex flex-col gap-3 py-1">
									{featurePopularity.topSizes.map((item) => {
										const pct =
											totalSizes > 0 ? (item.count / totalSizes) * 100 : 0;
										const isSquare = item.size.includes("Square");
										const isPost = item.size.includes("Post");
										const isPortrait = item.size.includes("Portrait");

										return (
											<div
												key={item.size}
												className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-3.5 shadow-xs transition-all hover:border-gray-200"
											>
												<div className="flex items-center gap-3.5">
													{/* Visual Aspect Ratio Mini Preview */}
													<div className="flex h-11 w-14 items-center justify-center rounded-lg bg-gray-50 border border-gray-200/60 p-1">
														{isSquare && (
															<div className="h-8 w-8 rounded-xs border-2 border-blue-500 bg-blue-50/70" />
														)}
														{isPost && (
															<div className="h-5 w-11 rounded-xs border-2 border-emerald-500 bg-emerald-50/70" />
														)}
														{isPortrait && (
															<div className="h-9 w-6 rounded-xs border-2 border-purple-500 bg-purple-50/70" />
														)}
														{!isSquare && !isPost && !isPortrait && (
															<div className="h-7 w-7 rounded-xs border-2 border-dashed border-gray-400" />
														)}
													</div>

													{/* Label & Dimensions */}
													<div className="flex flex-col">
														<span className="text-sm font-semibold text-gray-800">
															{item.size.split(" (")[0]}
														</span>
														<span className="text-xs text-gray-400 font-mono">
															{item.size.includes("(")
																? item.size.split("(")[1].replace(")", "")
																: item.size}
														</span>
													</div>
												</div>

												{/* Metric Counts & Percentage Share */}
												<div className="flex items-center gap-3">
													<div className="flex flex-col items-end">
														<span className="text-sm font-bold text-gray-900">
															{item.count}
														</span>
														<span className="text-xs font-medium text-gray-500">
															{pct.toFixed(1)}%
														</span>
													</div>
												</div>
											</div>
										);
									})}
								</div>
							);
						})()}
					</div>
					<div className="mt-3 border-t border-gray-100 pt-2.5">
						<p className="text-xs text-gray-500">
							Total sized assets:{" "}
							<span className="font-semibold text-gray-800">
								{featurePopularity.topSizes.reduce(
									(acc, curr) => acc + curr.count,
									0,
								)}
							</span>
						</p>
					</div>
				</Card>
			</div>

			{/* Format & Border Adoption */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-6">
				{/* Format Distribution */}
				<Card className="w-full min-w-0 flex flex-col justify-between">
					<div>
						<SectionTitle as="h4" size="sm" className="mb-4">
							Generation Format
						</SectionTitle>
						{(() => {
							const formatItems = featurePopularity.formatDistribution || [
								{ format: "Image Cover", count: 0 },
								{ format: "GIF Slideshow", count: 0 },
								{ format: "Carousel Deck", count: 0 },
							];
							const totalFormats = formatItems.reduce(
								(acc, curr) => acc + curr.count,
								0,
							);
							const formatColors = [
								"bg-emerald-500",
								"bg-amber-500",
								"bg-indigo-500",
							];

							if (totalFormats === 0) {
								return (
									<div className="flex h-[240px] items-center justify-center text-sm text-gray-400">
										No format data recorded yet
									</div>
								);
							}

							return (
								<div className="flex flex-col gap-6 py-2">
									{/* Segmented Proportional Bar */}
									<div className="flex h-5 w-full overflow-hidden rounded-full bg-gray-100 p-0.5 shadow-inner">
										{formatItems.map((item, idx) => {
											const pct =
												totalFormats > 0
													? (item.count / totalFormats) * 100
													: 0;
											if (pct === 0) return null;
											return (
												<div
													key={item.format}
													style={{ width: `${pct}%` }}
													className={`${formatColors[idx % formatColors.length]} transition-all duration-300 first:rounded-l-full last:rounded-r-full`}
													title={`${item.format}: ${item.count} (${pct.toFixed(1)}%)`}
												/>
											);
										})}
									</div>

									{/* Format breakdown rows */}
									<div className="flex flex-col gap-3">
										{formatItems.map((item, idx) => {
											const pct =
												totalFormats > 0
													? (item.count / totalFormats) * 100
													: 0;
											return (
												<div
													key={item.format}
													className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-3 shadow-xs"
												>
													<div className="flex items-center gap-2.5">
														<span
															className={`h-3 w-3 rounded-full ${formatColors[idx % formatColors.length]}`}
														/>
														<span className="text-sm font-medium text-gray-700">
															{item.format}
														</span>
													</div>
													<div className="flex items-center gap-3">
														<span className="text-sm font-bold text-gray-900">
															{item.count}
														</span>
														<span className="min-w-12 text-right text-xs font-semibold text-gray-500">
															{pct.toFixed(1)}%
														</span>
													</div>
												</div>
											);
										})}
									</div>
								</div>
							);
						})()}
					</div>
				</Card>

				{/* Border Adoption */}
				<Card className="w-full min-w-0">
					<SectionTitle as="h4" size="sm" className="mb-4">
						Border Adoption
					</SectionTitle>
					{(featurePopularity.borderUsageDistribution?.withBorder || 0) +
						(featurePopularity.borderUsageDistribution?.withoutBorder || 0) ===
					0 ? (
						<div className="flex h-[300px] items-center justify-center text-sm text-gray-400">
							No border data recorded yet
						</div>
					) : (
						<ResponsiveContainer width="100%" height={300} minWidth={0}>
							<PieChart>
								<Pie
									data={[
										{
											name: "With Border",
											value:
												featurePopularity.borderUsageDistribution?.withBorder ||
												0,
										},
										{
											name: "Without Border",
											value:
												featurePopularity.borderUsageDistribution
													?.withoutBorder || 0,
										},
									].map((item, idx) => ({
										...item,
										fill: COLORS[idx % COLORS.length],
									}))}
									dataKey="value"
									nameKey="name"
									cx="50%"
									cy="50%"
									outerRadius={100}
									label={renderPercentLabel}
								/>
								<Tooltip />
								<Legend />
							</PieChart>
						</ResponsiveContainer>
					)}
				</Card>
			</div>

			{/* Multi-Slide Slide Counts */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-6">
				{/* Slide Count Distribution */}
				<Card className="w-full min-w-0">
					<SectionTitle as="h4" size="sm" className="mb-4">
						Slide Count Distribution
					</SectionTitle>
					<ResponsiveContainer width="100%" height={300} minWidth={0}>
						<BarChart
							data={
								featurePopularity.slideCountDistribution || [
									{ range: "2 slides", count: 0 },
									{ range: "3-4 slides", count: 0 },
									{ range: "5+ slides", count: 0 },
								]
							}
							margin={{ top: 16, right: 16, left: -16, bottom: 0 }}
						>
							<CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
							<XAxis dataKey="range" />
							<YAxis allowDecimals={false} />
							<Tooltip />
							<Bar
								dataKey="count"
								fill="#8b5cf6"
								radius={[6, 6, 0, 0]}
								name="Generations"
							/>
						</BarChart>
					</ResponsiveContainer>
				</Card>

				{/* Average Slide Count KPI */}
				<Card className="w-full min-w-0 flex flex-col justify-between">
					<div>
						<SectionTitle as="h4" size="sm" className="mb-4">
							Multi-Slide Complexity
						</SectionTitle>
						<div className="grid grid-cols-1 gap-4 mb-4">
							<KPICard
								title="Average Slides per Multi-Slide"
								value={Number(
									(featurePopularity.avgSlideCount || 0).toFixed(1),
								)}
								color="purple"
							/>
						</div>
					</div>
					<div className="p-3 bg-white rounded-xl border border-gray-100">
						<p className="text-sm text-gray-600">
							Captures multi-slide carousel and GIF engagement across 2 to 10
							frame sequences.
						</p>
					</div>
				</Card>
			</div>

			{/* Title Length Distribution */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-6">
				<Card className="w-full min-w-0">
					<SectionTitle as="h4" size="sm" className="mb-4">
						Title Length Distribution
					</SectionTitle>
					<ResponsiveContainer width="100%" height={300} minWidth={0}>
						<BarChart
							data={[
								{
									category: `Short (0-${TITLE_LENGTH_THRESHOLDS.SHORT_MAX})`,
									count: featurePopularity.titleLengthDistribution.short,
								},
								{
									category: `Med (${TITLE_LENGTH_THRESHOLDS.SHORT_MAX + 1}-${TITLE_LENGTH_THRESHOLDS.MEDIUM_MAX})`,
									count: featurePopularity.titleLengthDistribution.medium,
								},
								{
									category: `Long (${TITLE_LENGTH_THRESHOLDS.MEDIUM_MAX + 1}+)`,
									count: featurePopularity.titleLengthDistribution.long,
								},
							]}
							margin={{ top: 16, right: 16, left: -16, bottom: 0 }}
						>
							<CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
							<XAxis dataKey="category" />
							<YAxis allowDecimals={false} />
							<Tooltip />
							<Bar
								dataKey="count"
								fill="#3b82f6"
								radius={[6, 6, 0, 0]}
								name="Generations"
							/>
						</BarChart>
					</ResponsiveContainer>
				</Card>

				{/* Subtitle Distribution */}
				<Card className="w-full min-w-0">
					<SectionTitle as="h4" size="sm" className="mb-4">
						Subtitle Usage Distribution
					</SectionTitle>
					<ResponsiveContainer width="100%" height={300} minWidth={0}>
						<BarChart
							data={[
								{
									category: "None",
									count: featurePopularity.subtitleUsageDistribution.none,
								},
								{
									category: `Short (1-${SUBTITLE_LENGTH_THRESHOLDS.SHORT_MAX})`,
									count: featurePopularity.subtitleUsageDistribution.short,
								},
								{
									category: `Med (${SUBTITLE_LENGTH_THRESHOLDS.SHORT_MAX + 1}-${SUBTITLE_LENGTH_THRESHOLDS.MEDIUM_MAX})`,
									count: featurePopularity.subtitleUsageDistribution.medium,
								},
								{
									category: `Long (${SUBTITLE_LENGTH_THRESHOLDS.MEDIUM_MAX + 1}+)`,
									count: featurePopularity.subtitleUsageDistribution.long,
								},
							]}
							margin={{ top: 16, right: 16, left: -16, bottom: 0 }}
						>
							<CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
							<XAxis dataKey="category" />
							<YAxis allowDecimals={false} />
							<Tooltip />
							<Bar
								dataKey="count"
								fill="#10b981"
								radius={[6, 6, 0, 0]}
								name="Generations"
							/>
						</BarChart>
					</ResponsiveContainer>
				</Card>
			</div>

			{/* Title & Subtitle Length Stats */}
			<Card className="mt-6 w-full min-w-0">
				<SectionTitle as="h4" size="sm" className="mb-4">
					Title & Subtitle Length Statistics
				</SectionTitle>

				{/* Title Stats */}
				<div className="mb-6">
					<h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
						Title Characters
					</h5>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						{[
							{
								title: "Average",
								value: featurePopularity.titleLengthStats.avgTitleLength,
								color: "blue" as const,
							},
							{
								title: "Minimum",
								value: featurePopularity.titleLengthStats.minTitleLength,
								color: "green" as const,
							},
							{
								title: "Maximum",
								value: featurePopularity.titleLengthStats.maxTitleLength,
								color: "purple" as const,
							},
						].map((card) => (
							<KPICard key={`title-${card.title}`} {...card} />
						))}
					</div>
				</div>

				{/* Subtitle Stats */}
				<div className="mb-6">
					<h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
						Subtitle Characters (when present)
					</h5>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						{[
							{
								title: "Average",
								value:
									featurePopularity.subtitleLengthStats?.avgSubtitleLength || 0,
								color: "blue" as const,
							},
							{
								title: "Minimum",
								value:
									featurePopularity.subtitleLengthStats?.minSubtitleLength || 0,
								color: "green" as const,
							},
							{
								title: "Maximum",
								value:
									featurePopularity.subtitleLengthStats?.maxSubtitleLength || 0,
								color: "purple" as const,
							},
						].map((card) => (
							<KPICard key={`sub-${card.title}`} {...card} />
						))}
					</div>
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
	);
}
