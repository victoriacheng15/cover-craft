"use client";

import { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";

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

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">Analytics</h2>
        {loading && <p>Loading analytics...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {data && (
          <div className="space-y-8">
            <section>
              <h3 className="text-xl font-semibold mb-2">Totals</h3>
              <ul className="list-disc ml-6">
                <li>Total generate clicks: {data.generateClickCount}</li>
                <li>Total download clicks: {data.downloadClickCount}</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-2">
                Generate Clicks Per Month
              </h3>
              <table className="min-w-full border">
                <thead>
                  <tr>
                    <th className="border px-2 py-1">Year</th>
                    <th className="border px-2 py-1">Month</th>
                    <th className="border px-2 py-1">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {data.generateClicksPerMonth.map((row) => (
                    <tr key={row._id.year + "-" + row._id.month}>
                      <td className="border px-2 py-1">{row._id.year}</td>
                      <td className="border px-2 py-1">{row._id.month}</td>
                      <td className="border px-2 py-1">{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-2">
                Download Clicks Per Month
              </h3>
              <table className="min-w-full border">
                <thead>
                  <tr>
                    <th className="border px-2 py-1">Year</th>
                    <th className="border px-2 py-1">Month</th>
                    <th className="border px-2 py-1">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {data.downloadClicksPerMonth.map((row) => (
                    <tr key={row._id.year + "-" + row._id.month}>
                      <td className="border px-2 py-1">{row._id.year}</td>
                      <td className="border px-2 py-1">{row._id.month}</td>
                      <td className="border px-2 py-1">{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-2">
                Generate Clicks by Font
              </h3>
              <table className="min-w-full border">
                <thead>
                  <tr>
                    <th className="border px-2 py-1">Font</th>
                    <th className="border px-2 py-1">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {data.generateByFont.map((row) => (
                    <tr key={row._id}>
                      <td className="border px-2 py-1">{row._id}</td>
                      <td className="border px-2 py-1">{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-2">
                Generate Clicks by Size
              </h3>
              <table className="min-w-full border">
                <thead>
                  <tr>
                    <th className="border px-2 py-1">Size Preset</th>
                    <th className="border px-2 py-1">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {data.generateBySize.map((row) => (
                    <tr key={row._id}>
                      <td className="border px-2 py-1">{row._id}</td>
                      <td className="border px-2 py-1">{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
