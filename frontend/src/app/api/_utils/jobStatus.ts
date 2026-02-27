/**
 * Server-side proxy handler for the getJobStatus endpoint
 */
export async function proxyJobStatus(jobId: string) {
	const API_URL = process.env.AZURE_FUNCTION_URL;
	const API_KEY = process.env.AZURE_FUNCTION_KEY;
	const response = await fetch(`${API_URL}/getJobStatus?jobId=${jobId}`, {
		headers: {
			"x-functions-key": API_KEY || "",
		},
	});

	return response;
}
