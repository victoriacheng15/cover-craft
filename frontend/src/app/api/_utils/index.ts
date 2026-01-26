export { proxyAnalytics } from "./analytics";
export {
	type ApiErrorResponse,
	handleApiError,
} from "./errorHandler";
export {
	type ImageParams,
	proxyGenerateCoverImage,
} from "./generateCoverImage";
export { type HealthResponse, proxyHealth } from "./health";
export {
	DOWNLOAD_CLICK_EVENT,
	type EventType,
	GENERATE_CLICK_EVENT,
	type MetricPayload,
	type MetricStatus,
	proxyMetrics,
	type WcagLevel,
} from "./metrics";
