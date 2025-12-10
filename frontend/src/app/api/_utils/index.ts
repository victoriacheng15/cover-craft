/**
 * Barrel export for all API utilities
 */

// Re-export types
export type {
	ApiError,
	ApiErrorResponse,
} from "./errorHandler";
export type {
	GenerateCoverImageError,
	GenerateCoverErrorDetail,
	GenerateCoverErrorBody,
	ImageParams,
} from "./generateCoverImage";
export type {
	SaveFilePickerOptions,
	FileSystemFileHandle,
	FileSystemWritableFileStream,
} from "./downloadImage";
export type { HealthResponse } from "./health";
export type {
	MetricsPayload,
	MetricTimestamp,
	WcagLevel,
	GenerateClickMetrics,
} from "./metrics";

// Re-export functions
export { handleApiError } from "./errorHandler";
export {
	generateCoverImage,
	proxyGenerateCoverImage,
} from "./generateCoverImage";
export { downloadImage } from "./downloadImage";
export { health, proxyHealth } from "./health";
export { getAnalytics, proxyAnalytics } from "./analytics";
export { sendMetrics, proxyMetrics } from "./metrics";
