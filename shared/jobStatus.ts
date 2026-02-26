export const JOB_STATUS_PENDING = "pending";
export const JOB_STATUS_PROCESSING = "processing";
export const JOB_STATUS_COMPLETED = "completed";
export const JOB_STATUS_FAILED = "failed";

export type JobStatus =
	| typeof JOB_STATUS_PENDING
	| typeof JOB_STATUS_PROCESSING
	| typeof JOB_STATUS_COMPLETED
	| typeof JOB_STATUS_FAILED;
