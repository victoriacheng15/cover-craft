export { proxyAnalytics } from "./analytics";
export {
	type ApiErrorResponse,
	handleApiError,
} from "./errorHandler";
export {
	type ImageParams,
	proxyGenerateImage,
} from "./generateImage";
export { proxyGenerateImages } from "./generateImages";
export { type HealthResponse, proxyHealth } from "./health";
export { proxyJobStatus } from "./jobStatus";
export {
	DOWNLOAD_CLICK_EVENT,
	type EventType,
	GENERATE_CLICK_EVENT,
	type MetricPayload,
	type MetricStatus,
	proxyMetrics,
	type WcagLevel,
} from "./metrics";
