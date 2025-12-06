// Minimal types for File System Access API
export type SaveFilePickerOptions = {
	suggestedName?: string;
	types?: Array<{
		description?: string;
		accept: Record<string, string[]>;
	}>;
};

export interface FileSystemFileHandle {
	createWritable: () => Promise<FileSystemWritableFileStream>;
}

export interface FileSystemWritableFileStream {
	write: (data: Blob | BufferSource | string) => Promise<void>;
	close: () => Promise<void>;
}
export interface ImageParams {
	width: number;
	height: number;
	backgroundColor: string;
	textColor: string;
	font: string;
	title: string;
	subtitle?: string;
	filename: string;
}

export interface ApiError {
	error: string;
	details?: Array<{ field: string; message: string }>;
}

export interface HealthResponse {
	status: string;
	timestamp: string;
}

// Typings for analytics metrics
export type MetricTimestamp = string | Date | number;
export type WcagLevel = "AAA" | "AA" | "FAIL"; // WCAG compliance level

export interface GenerateClickMetrics {
	event: "generate_click";
	timestamp: MetricTimestamp;
	status: "success" | "error";
	size: {
		width: number;
		height: number;
	}
	font: string;
	titleLength: number;
	subtitleLength?: number;
	contrastRatio: number;
	wcagLevel: WcagLevel;
	clientDuration?: number;
	errorMessage?: string;
}

// Error-specific metrics no longer used; keep GenerateClickMetrics and allow errorMessage optional
