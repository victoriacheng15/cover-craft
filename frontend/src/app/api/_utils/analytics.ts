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
	const API_URL = process.env.AZURE_FUNCTION_URL;

	const response = await fetch(`${API_URL}/analytics`);
	if (!response.ok) {
		throw new Error(`Failed to fetch analytics: ${response.statusText}`);
	}
	return response.json();
}