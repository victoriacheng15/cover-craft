export const GENERATE_CLICK_EVENT = "generate_click";
export const DOWNLOAD_CLICK_EVENT = "download_click";
export const IMAGE_GENERATED_EVENT = "image_generated";

export type WcagLevel = "AAA" | "AA" | "FAIL";
export type MetricStatus = "success" | "error" | "validation_error";

export type EventType =
	| typeof GENERATE_CLICK_EVENT
	| typeof DOWNLOAD_CLICK_EVENT
	| typeof IMAGE_GENERATED_EVENT;

export interface MetricPayload {
	// Core event data
	event: EventType | string;
	timestamp: string; // ISO 8601 date string
	status: MetricStatus;
	errorMessage?: string;

	// Cover generation data
	size?: {
		width: number;
		height: number;
	};
	font?: string;
	titleLength?: number;
	subtitleLength?: number;

	// Form/Validation data
	contrastRatio?: number;
	wcagLevel?: WcagLevel; // "AAA" | "AA" | "FAIL"

	// Performance/Timing data
	duration?: number; // Backend generation duration (ms)
	clientDuration?: number; // Client-side duration (ms)
}
