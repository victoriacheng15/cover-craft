import { useEffect, useState } from "react";

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

export function useAnalytics() {
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
  const COLORS = [
    "#34d399",
    "#60a5fa",
    "#fbbf24",
    "#f87171",
    "#a78bfa",
    "#f472b6",
    "#38bdf8",
    "#facc15",
  ];

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

  // Prepare data for monthly line chart (last 12 months)
  function getLast12Months() {
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        label:
          d.toLocaleString("default", { month: "short" }) +
          " " +
          d.getFullYear(),
      });
    }
    return months;
  }

  const last12Months = getLast12Months();
  const monthlyLineData = last12Months.map(({ year, month, label }) => {
    const generate =
      data?.generateClicksPerMonth.find(
        (row) => row._id.year === year && row._id.month === month,
      )?.count || 0;
    const download =
      data?.downloadClicksPerMonth.find(
        (row) => row._id.year === year && row._id.month === month,
      )?.count || 0;
    return {
      month: label,
      Generate: generate,
      Download: download,
    };
  });

  return { data, loading, error, COLORS, totalClicksData, monthlyLineData };
}
