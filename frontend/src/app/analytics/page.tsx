"use client";

import { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface AnalyticsData {
  eventCounts: { _id: string; count: number }[];
  generateClickCount: number;
  downloadClickCount: number;
  generateClicksPerMonth: {
    _id: { year: number; month: number };
    count: number;
  }[];
  downloadClicksPerMonth: {
    _id: { year: number; month: number };
    count: number;
  }[];
  generateByFont: { _id: string; count: number }[];
  generateBySize: { _id: string; count: number }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/analytics");
        if (!res.ok) throw new Error("Failed to fetch analytics");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  // Chart colors
  const COLORS = ["#34d399", "#60a5fa", "#fbbf24", "#f87171", "#a78bfa", "#f472b6", "#38bdf8", "#facc15"];

  // Prepare data for total clicks chart, including combined total
  const totalGenerate = data?.generateClickCount || 0;
  const totalDownload = data?.downloadClickCount || 0;
  const totalCombined = totalGenerate + totalDownload;
  const totalClicksData = [
    { name: "Total", value: totalCombined },
    { name: "Generate", value: totalGenerate },
    { name: "Download", value: totalDownload },
  ];

  // Prepare data for current month chart
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentMonthGenerate = data?.generateClicksPerMonth.find(
    (row) => row._id.year === currentYear && row._id.month === currentMonth
  )?.count || 0;
  const currentMonthDownload = data?.downloadClicksPerMonth.find(
    (row) => row._id.year === currentYear && row._id.month === currentMonth
  )?.count || 0;
  const currentMonthData = [
    { name: "Generate", value: currentMonthGenerate },
    { name: "Download", value: currentMonthDownload },
  ];

  // Prepare data for monthly line chart (last 12 months)
  function getLast12Months() {
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        label: d.toLocaleString('default', { month: 'short' }) + ' ' + d.getFullYear(),
      });
    }
    return months;
  }

  const last12Months = getLast12Months();
  const monthlyLineData = last12Months.map(({ year, month, label }) => {
    const generate = data?.generateClicksPerMonth.find((row) => row._id.year === year && row._id.month === month)?.count || 0;
    const download = data?.downloadClicksPerMonth.find((row) => row._id.year === year && row._id.month === month)?.count || 0;
    return {
      month: label,
      Generate: generate,
      Download: download,
    };
  });

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">Analytics</h2>
        {loading && <p>Loading analytics...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {data && (
          <div className="flex flex-col gap-8">
            <section>
              <h3 className="text-xl font-semibold mb-2">Total Generate, Download & Combined Clicks</h3>
              <div className="w-full min-w-0">
                <ResponsiveContainer width="100%" height={250} minWidth={0}>
                  <BarChart data={totalClicksData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value">
                      <Cell fill="#fbbf24" /> {/* Total */}
                      <Cell fill="#34d399" /> {/* Generate */}
                      <Cell fill="#60a5fa" /> {/* Download */}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-2">Monthly Click Trends (Last 12 Months)</h3>
              <div className="w-full min-w-0">
                <ResponsiveContainer width="100%" height={250} minWidth={0}>
                  <LineChart data={monthlyLineData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                    <XAxis dataKey="month" angle={-30} textAnchor="end" height={60} interval={0} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="Generate" stroke="#34d399" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Download" stroke="#60a5fa" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <div className="flex flex-col sm:flex-row gap-8">
              <section className="flex-1">
                <h3 className="text-xl font-semibold mb-2">Font Usage Distribution</h3>
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
                        <Cell key={`cell-font-${entry._id}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </section>
              <section className="flex-1">
                <h3 className="text-xl font-semibold mb-2">Size Presets Distribution</h3>
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
                        <Cell key={`cell-size-${entry._id}`} fill={COLORS[idx % COLORS.length]} />
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
