"use client";

import {
  Bar,
  BarChart,
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
  const { data, loading, error, COLORS, totalClicksData, monthlyLineData } =
    useAnalytics();

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <SectionTitle size="lg">Analytics</SectionTitle>
        {loading && <p>Loading analytics...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {data && (
          <div className="flex flex-col gap-8">
            <section>
              <SectionTitle as="h3" size="md">
                Total Generate, Download & Combined Clicks
              </SectionTitle>
              <div className="w-full min-w-0 bg-slate-100 rounded-lg p-4">
                <ResponsiveContainer width="100%" height={250} minWidth={0}>
                  <BarChart
                    data={totalClicksData}
                    margin={{ top: 16, right: 16, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value">
                      <Cell fill="#475569" /> {/* Total - slate-600 */}
                      <Cell fill="#10b981" /> {/* Generate - emerald-500 */}
                      <Cell fill="#3b82f6" /> {/* Download - blue-500 */}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section>
              <SectionTitle as="h3" size="md">
                Monthly Click Trends (Last 12 Months)
              </SectionTitle>
              <div className="w-full min-w-0 bg-slate-100 rounded-lg p-4">
                <ResponsiveContainer width="100%" height={250} minWidth={0}>
                  <LineChart
                    data={monthlyLineData}
                    margin={{ top: 16, right: 16, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                    <XAxis
                      dataKey="month"
                      angle={-30}
                      textAnchor="end"
                      height={60}
                      interval={0}
                    />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="Generate"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Download"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <div className="flex flex-col sm:flex-row gap-8">
              <section className="flex-1 bg-slate-100 rounded-lg p-4">
                <SectionTitle as="h3" size="md">
                  Font Usage Distribution
                </SectionTitle>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.generateByFont}
                      dataKey="count"
                      nameKey="_id"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {data.generateByFont.map((entry, idx) => (
                        <Cell
                          key={`cell-font-${entry._id}`}
                          fill={COLORS[idx % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </section>
              <section className="flex-1 bg-slate-100 rounded-lg p-4">
                <SectionTitle as="h3" size="md">
                  Size Presets Distribution
                </SectionTitle>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.generateBySize}
                      dataKey="count"
                      nameKey="_id"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {data.generateBySize.map((entry, idx) => (
                        <Cell
                          key={`cell-size-${entry._id}`}
                          fill={COLORS[idx % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </section>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
