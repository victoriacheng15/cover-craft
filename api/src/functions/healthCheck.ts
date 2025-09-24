import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function healthCheck(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
	const now = new Date();
  
	return {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			localTime: now.toLocaleString(),
			isoTime: now.toISOString()
		})
	};
}

app.http('healthCheck', {
	methods: ['GET'],
	authLevel: 'anonymous',
	handler: healthCheck
});
