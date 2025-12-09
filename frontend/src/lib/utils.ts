import {
	Lato,
	Montserrat,
	Open_Sans,
	Playfair_Display,
	Roboto,
} from "next/font/google";
import type { MetricTimestamp } from "./types";

export const montserrat = Montserrat({
	variable: "--font-montserrat",
	subsets: ["latin"],
	weight: ["400", "700"],
});

export const roboto = Roboto({
	variable: "--font-roboto",
	subsets: ["latin"],
	weight: ["400", "700"],
});

export const lato = Lato({
	variable: "--font-lato",
	subsets: ["latin"],
	weight: ["400", "700"],
});

export const playfairDisplay = Playfair_Display({
	variable: "--font-playfair-display",
	subsets: ["latin"],
	weight: ["400", "700"],
});

export const openSans = Open_Sans({
	variable: "--font-open-sans",
	subsets: ["latin"],
	weight: ["400", "700"],
});

export const fontFamilyMap: Record<string, string> = {
	Montserrat: "var(--font-montserrat)",
	Roboto: "var(--font-roboto)",
	Lato: "var(--font-lato)",
	"Playfair Display": "var(--font-playfair-display)",
	"Open Sans": "var(--font-open-sans)",
};

export function cn(...classes: (string | undefined | null | false)[]) {
	return classes.filter(Boolean).join(" ");
}

// Metrics helpers
export type MetricPayload = {
	event: string;
	timestamp?: MetricTimestamp;
	status?: string;
} & Record<string, unknown>;

export async function sendMetric(payload: MetricPayload) {
	try {
		if (
			!payload ||
			typeof payload !== "object" ||
			Array.isArray(payload) ||
			typeof payload.event !== "string"
		)
			return;

		const payloadToSend: MetricPayload = {
			...payload,
			timestamp: payload.timestamp ?? new Date().toISOString(),
			status: payload.status ?? "success",
		};

		await fetch("/api/metrics", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payloadToSend),
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
				status: "success",
			}),
		});
	} catch (_err) {}
}
