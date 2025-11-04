export interface ImageParams {
  width: number;
  height: number;
  backgroundColor: string;
  textColor: string;
  font: string;
  heading: string;
  subheading: string;
  imageName: string;
}

export interface ApiError {
  error: string;
  details?: Array<{ field: string; message: string }>;
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
}
