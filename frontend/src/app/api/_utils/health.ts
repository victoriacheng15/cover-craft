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
	const API_URL = process.env.AZURE_FUNCTION_URL;
	const response = await fetch(`${API_URL}/health`);
	if (!response.ok) {
		throw new Error(`Health check failed: ${response.statusText}`);
	}
	return response.json();
}
