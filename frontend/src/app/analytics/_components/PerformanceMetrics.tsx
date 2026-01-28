import type { PerformanceMetrics as PerformanceMetricsType } from "@cover-craft/shared";
import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Card, KPICard, SectionTitle } from "@/components/ui";

interface PerformanceMetricsProps {
	performanceMetrics: PerformanceMetricsType;
}

export function PerformanceMetrics({
	performanceMetrics,
}: PerformanceMetricsProps) {
	return (
		<section>
			<SectionTitle as="h3" size="md">
				Performance Metrics
			</SectionTitle>

			{/* Key Performance Indicators */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
				{[
					{
						title: "Avg Backend Duration",
						value: performanceMetrics.backendPerformance.avgBackendDuration,
						color: "white" as const,
						suffix: "ms",
					},
					{
						title: "Avg Client Duration",
						value: performanceMetrics.clientPerformance.avgClientDuration,
						color: "white" as const,
						suffix: "ms",
					},
					{
						title: "Network Latency",
						value: performanceMetrics.networkLatency.avgNetworkLatency,
						color: "white" as const,
						suffix: "ms",
					},
					{
						title: "P95 Backend Duration",
						value: performanceMetrics.backendPerformance.p95BackendDuration,
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
							data={performanceMetrics.backendPerformance.backendDurationTrend}
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
							<Line type="monotone" dataKey="p50" stroke="#3b82f6" name="P50" />
							<Line type="monotone" dataKey="p95" stroke="#8b5cf6" name="P95" />
							<Line type="monotone" dataKey="p99" stroke="#ef4444" name="P99" />
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
							data={performanceMetrics.clientPerformance.clientDurationTrend}
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
							<Line type="monotone" dataKey="p50" stroke="#3b82f6" name="P50" />
							<Line type="monotone" dataKey="p95" stroke="#8b5cf6" name="P95" />
							<Line type="monotone" dataKey="p99" stroke="#ec4899" name="P99" />
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
								<th className="text-right p-2">P95 Backend (ms)</th>
								<th className="text-right p-2">Avg Client (ms)</th>
								<th className="text-right p-2">Avg Total (ms)</th>
							</tr>
						</thead>
						<tbody>
							{performanceMetrics.performanceBySize.map((sizeMetric, idx) => (
								<tr
									key={`perf-size-${sizeMetric.size}`}
									className={idx % 2 === 0 ? "bg-white" : "bg-emerald-50/30"}
								>
									<td className="p-2 font-medium">{sizeMetric.size}</td>
									<td className="text-right p-2">
										{sizeMetric.avgBackendDuration?.toFixed(0) || "-"}
									</td>
									<td className="text-right p-2 text-orange-600 font-medium">
										{sizeMetric.p95BackendDuration?.toFixed(0) || "-"}
									</td>
									<td className="text-right p-2">
										{sizeMetric.avgClientDuration?.toFixed(0) || "-"}
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
							))}
						</tbody>
					</table>
				</div>
			</Card>
		</section>
	);
}
