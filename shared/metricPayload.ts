export const GENERATE_CLICK_EVENT = "generate_click";
export const DOWNLOAD_CLICK_EVENT = "download_click";
export const IMAGE_GENERATED_EVENT = "image_generated";
export const METRIC_STATUS_SUCCESS = "success";
export const METRIC_STATUS_ERROR = "error";
export const METRIC_STATUS_VALIDATION_ERROR = "validation_error";

export type WcagLevel = "AAA" | "AA" | "FAIL";
export type MetricStatus =
	| typeof METRIC_STATUS_SUCCESS
	| typeof METRIC_STATUS_ERROR
	| typeof METRIC_STATUS_VALIDATION_ERROR;

export type EventType =
	| typeof GENERATE_CLICK_EVENT
	| typeof DOWNLOAD_CLICK_EVENT
	| typeof IMAGE_GENERATED_EVENT;

export interface MetricPayload {
	// Core event data
	event: EventType | string;
	timestamp: string;
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
	wcagLevel?: WcagLevel;

	// Performance/Timing data
	duration?: number; // Backend generation duration (ms)
	clientDuration?: number; // Client-side duration (ms)
}
