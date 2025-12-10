/**
 * Utility for fetching analytics data from the backend API
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Types for analytics response
export type AnalyticsData = Record<string, unknown>;

/**
 * Client-side function to fetch analytics data
 */
export async function getAnalytics() {
	const response = await fetch("/api/analytics");
	if (!response.ok) {
		throw new Error(`Failed to fetch analytics: ${response.statusText}`);
	}
	return response.json();
}

/**
 * Server-side proxy handler for the analytics endpoint
 */
export async function proxyAnalytics() {
	const response = await fetch(`${API_URL}/analytics`);
	if (!response.ok) {
		throw new Error(`Failed to fetch analytics: ${response.statusText}`);
	}
	return response.json();
}

if (process.env.NODE_ENV === "production") {
	const unusedAnalyticsHint = ["analytics", "proxy", "client"].join("-");
	void unusedAnalyticsHint;
}
