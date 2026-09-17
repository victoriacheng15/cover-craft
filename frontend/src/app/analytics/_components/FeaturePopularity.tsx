import {
	type FeaturePopularity as FeaturePopularityType,
	SUBTITLE_LENGTH_THRESHOLDS,
	TITLE_LENGTH_THRESHOLDS,
} from "@cover-craft/shared";
import {
	CartesianGrid,
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
			<Card className="h-62.5 mb-6" />
			<Card className="h-48" />
		</section>
	);
}

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
				<Card>
					<SectionTitle as="h4" size="sm" className="mb-4">
						Top Fonts
					</SectionTitle>
					<ResponsiveContainer width="100%" height={300}>
						<PieChart>
							<Pie
								data={featurePopularity.topFonts.map((entry, idx) => ({
									...entry,
									fill: COLORS[idx % COLORS.length],
								}))}
								dataKey="count"
								nameKey="font"
								cx="50%"
								cy="50%"
								outerRadius={100}
								label
							/>
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
								data={featurePopularity.topSizes.map((entry, idx) => ({
									...entry,
									fill: COLORS[idx % COLORS.length],
								}))}
								dataKey="count"
								nameKey="size"
								cx="50%"
								cy="50%"
								outerRadius={100}
								label
							/>
							<Tooltip />
							<Legend />
						</PieChart>
					</ResponsiveContainer>
				</Card>
			</div>

			{/* Format & Border Adoption */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-6">
				{/* Format Distribution */}
				<Card>
					<SectionTitle as="h4" size="sm" className="mb-4">
						Generation Format
					</SectionTitle>
					<ResponsiveContainer width="100%" height={300}>
						<PieChart>
							<Pie
								data={(
									featurePopularity.formatDistribution || [
										{ format: "Image Cover", count: 0 },
										{ format: "GIF Slideshow", count: 0 },
									]
								).map((entry, idx) => ({
									...entry,
									fill: COLORS[idx % COLORS.length],
								}))}
								dataKey="count"
								nameKey="format"
								cx="50%"
								cy="50%"
								outerRadius={100}
								label
							/>
							<Tooltip />
							<Legend />
						</PieChart>
					</ResponsiveContainer>
				</Card>

				{/* Border Adoption */}
				<Card>
					<SectionTitle as="h4" size="sm" className="mb-4">
						Border Adoption
					</SectionTitle>
					<ResponsiveContainer width="100%" height={230}>
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
									fill: COLORS[(idx + 2) % COLORS.length],
								}))}
								dataKey="value"
								nameKey="name"
								cx="50%"
								cy="50%"
								outerRadius={80}
								label
							/>
							<Tooltip />
							<Legend />
						</PieChart>
					</ResponsiveContainer>
					<div className="p-3 bg-white rounded-xl border border-gray-100 mt-2">
						<p className="text-sm">
							<span className="font-semibold text-emerald-600">
								{(featurePopularity.borderUsagePercent || 0).toFixed(1)}%
							</span>{" "}
							of generated outputs include a border
						</p>
					</div>
				</Card>
			</div>

			{/* Slideshow Slide Counts */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-6">
				{/* Slide Count Distribution */}
				<Card>
					<SectionTitle as="h4" size="sm" className="mb-4">
						Slideshow Length Distribution
					</SectionTitle>
					<ResponsiveContainer width="100%" height={300}>
						<PieChart>
							<Pie
								data={(
									featurePopularity.slideCountDistribution || [
										{ range: "2 slides", count: 0 },
										{ range: "3-4 slides", count: 0 },
										{ range: "5+ slides", count: 0 },
									]
								).map((entry, idx) => ({
									...entry,
									fill: COLORS[(idx + 4) % COLORS.length],
								}))}
								dataKey="count"
								nameKey="range"
								cx="50%"
								cy="50%"
								outerRadius={100}
								label
							/>
							<Tooltip />
							<Legend />
						</PieChart>
					</ResponsiveContainer>
				</Card>

				{/* Average Slide Count KPI */}
				<Card className="flex flex-col justify-between">
					<div>
						<SectionTitle as="h4" size="sm" className="mb-4">
							Slideshow Complexity
						</SectionTitle>
						<div className="grid grid-cols-1 gap-4 mb-4">
							<KPICard
								title="Average Slides per GIF"
								value={Number(
									(featurePopularity.avgSlideCount || 0).toFixed(1),
								)}
								color="purple"
							/>
						</div>
					</div>
					<div className="p-3 bg-white rounded-xl border border-gray-100">
						<p className="text-sm text-gray-600">
							Captures multi-slide carousel engagement across 2 to 10 frame
							sequences.
						</p>
					</div>
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
										value: featurePopularity.titleLengthDistribution.short,
									},
									{
										name: `Medium (${TITLE_LENGTH_THRESHOLDS.SHORT_MAX + 1}-${TITLE_LENGTH_THRESHOLDS.MEDIUM_MAX})`,
										value: featurePopularity.titleLengthDistribution.medium,
									},
									{
										name: `Long (${TITLE_LENGTH_THRESHOLDS.MEDIUM_MAX + 1}+)`,
										value: featurePopularity.titleLengthDistribution.long,
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
								label
							/>
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
										value: featurePopularity.subtitleUsageDistribution.none,
									},
									{
										name: `Short (1-${SUBTITLE_LENGTH_THRESHOLDS.SHORT_MAX})`,
										value: featurePopularity.subtitleUsageDistribution.short,
									},
									{
										name: `Medium (${SUBTITLE_LENGTH_THRESHOLDS.SHORT_MAX + 1}-${SUBTITLE_LENGTH_THRESHOLDS.MEDIUM_MAX})`,
										value: featurePopularity.subtitleUsageDistribution.medium,
									},
									{
										name: `Long (${SUBTITLE_LENGTH_THRESHOLDS.MEDIUM_MAX + 1}+)`,
										value: featurePopularity.subtitleUsageDistribution.long,
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
								label
							/>
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
									typeof value === "number" ? `${value.toFixed(1)}%` : value
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
	);
}
