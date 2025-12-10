/**
 * Barrel export for all API utilities
 */

export { getAnalytics, proxyAnalytics } from "./analytics";
export type {
	FileSystemFileHandle,
	FileSystemWritableFileStream,
	SaveFilePickerOptions,
} from "./downloadImage";
export { downloadImage } from "./downloadImage";
// Re-export types
export type {
	ApiError,
	ApiErrorResponse,
} from "./errorHandler";
// Re-export functions
export { handleApiError } from "./errorHandler";
export type {
	GenerateCoverErrorBody,
	GenerateCoverErrorDetail,
	GenerateCoverImageError,
	ImageParams,
} from "./generateCoverImage";
export {
	generateCoverImage,
	proxyGenerateCoverImage,
} from "./generateCoverImage";
export type { HealthResponse } from "./health";
export { health, proxyHealth } from "./health";
export type {
	GenerateClickMetrics,
	MetricsPayload,
	MetricTimestamp,
	WcagLevel,
} from "./metrics";
export { proxyMetrics, sendMetrics } from "./metrics";
