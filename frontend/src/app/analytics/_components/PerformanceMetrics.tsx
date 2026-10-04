import type { PerformanceMetrics as PerformanceMetricsType } from "@cover-craft/shared";
import { Card, KPICard, SectionTitle, Skeleton } from "@/components/ui";

interface PerformanceMetricsProps {
	performanceMetrics: PerformanceMetricsType;
}

export function PerformanceMetricsSkeleton() {
	return (
		<section>
			<SectionTitle as="h3" size="md">
				Performance Metrics
			</SectionTitle>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
				{["p1", "p2", "p3", "p4"].map((id) => (
					<Skeleton key={`perf-kpi-${id}`} className="h-24 w-full" />
				))}
			</div>
			<Card className="h-64" />
		</section>
	);
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

			{/* Performance by Size */}
			<Card className="w-full min-w-0">
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
							{!performanceMetrics.performanceBySize ||
							performanceMetrics.performanceBySize.length === 0 ? (
								<tr>
									<td
										colSpan={5}
										className="p-4 text-center text-sm text-gray-400"
									>
										No size-specific performance data recorded yet
									</td>
								</tr>
							) : (
								performanceMetrics.performanceBySize.map((sizeMetric, idx) => (
									<tr
										key={`perf-size-${sizeMetric.size}`}
										className={idx % 2 === 0 ? "bg-white" : "bg-emerald-50/30"}
									>
										<td className="p-2 font-medium">{sizeMetric.size}</td>
										<td className="text-right p-2">
											{sizeMetric.avgBackendDuration
												? sizeMetric.avgBackendDuration.toFixed(0)
												: "-"}
										</td>
										<td className="text-right p-2 text-orange-600 font-medium">
											{sizeMetric.p95BackendDuration
												? sizeMetric.p95BackendDuration.toFixed(0)
												: "-"}
										</td>
										<td className="text-right p-2">
											{sizeMetric.avgClientDuration
												? sizeMetric.avgClientDuration.toFixed(0)
												: "-"}
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
								))
							)}
						</tbody>
					</table>
				</div>
			</Card>
		</section>
	);
}
