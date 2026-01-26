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
