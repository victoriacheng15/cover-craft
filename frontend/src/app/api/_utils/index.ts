export { getAnalytics, proxyAnalytics } from "./analytics";
export {
	downloadImage,
	type FileSystemFileHandle,
	type FileSystemWritableFileStream,
	type SaveFilePickerOptions,
} from "./downloadImage";
export {
	type ApiErrorResponse,
	handleApiError,
} from "./errorHandler";
export {
	generateCoverImage,
	type ImageParams,
	proxyGenerateCoverImage,
} from "./generateCoverImage";
export { type HealthResponse, health, proxyHealth } from "./health";
export {
	DOWNLOAD_CLICK_EVENT,
	type EventType,
	GENERATE_CLICK_EVENT,
	type MetricPayload,
	type MetricStatus,
	proxyMetrics,
	sendDownloadEvent,
	sendGenerateEvent,
	sendMetrics,
	type WcagLevel,
} from "./metrics";
