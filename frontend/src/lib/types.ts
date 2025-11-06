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

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
}
