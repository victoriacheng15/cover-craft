export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

// Metrics helpers
export async function sendGenericMetric(
  event: string,
  sizePreset: string,
  font: string,
) {
  try {
    await fetch("/api/metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        sizePreset,
        font,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (_err) {}
}

export async function sendDownloadMetric() {
  try {
    await fetch("/api/metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "download_click",
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (_err) {}
}
