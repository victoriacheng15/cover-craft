/**
 * Utility for fetching health status from the backend API
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface HealthResponse {
	status: string;
	timestamp: string;
}

/**
 * Client-side function to check backend health
 */
export async function health(): Promise<HealthResponse> {
	const response = await fetch("/api/health");
	if (!response.ok) {
		throw new Error(`Health check failed: ${response.statusText}`);
	}
	return response.json();
}

/**
 * Server-side proxy handler for the health endpoint
 */
export async function proxyHealth() {
	const response = await fetch(`${API_URL}/health`);
	if (!response.ok) {
		throw new Error(`Health check failed: ${response.statusText}`);
	}
	return response.json();
}
