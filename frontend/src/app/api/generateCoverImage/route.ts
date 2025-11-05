export async function POST(request: Request) {
  // Proxy to Azure Functions generateCoverImage endpoint
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7071/api";
  const body = await request.json();
  const response = await fetch(`${apiUrl}/generateCoverImage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const blob = await response.blob();

  return new Response(blob, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "image/png",
    },
  });
}
