import type { InvocationContext } from "@azure/functions";
import mongoose, { type Model } from "mongoose";

let mongoConnected = false;

// Interface for the Metric document
export interface MetricDocument {
	event: string;
	timestamp: Date;
	status: string;
	errorMessage?: string;
	size?: {
		width: number;
		height: number;
	};
	font?: string;
	titleLength?: number;
	subtitleLength?: number;
	contrastRatio?: number;
	wcagLevel?: string;
	duration?: number;
	clientDuration?: number;
}

export const metricSchema = new mongoose.Schema({
	// Core event data
	event: { type: String, required: true, index: true },
	timestamp: { type: Date, required: true, index: true },
	status: {
		type: String,
		enum: ["success", "error", "validation_error"],
		required: true,
	},
	errorMessage: String,
	size: {
		width: { type: Number },
		height: { type: Number },
	},
	font: { type: String },
	titleLength: { type: Number },
	subtitleLength: { type: Number },

	// Form/Validation data
	contrastRatio: { type: Number },
	wcagLevel: { type: String }, // "AAA" | "AA" | "FAIL"

	// Performance/Timing data
	duration: { type: Number },
	clientDuration: { type: Number },
});

// Define the Log schema
const logSchema = new mongoose.Schema(
	{
		timestamp: { type: Date, required: true, index: true },
		level: {
			type: String,
			required: true,
			enum: ["INFO", "WARN", "ERROR", "DEBUG"],
			index: true,
		},
		message: { type: String, required: true },
		invocationId: { type: String, index: true },
		functionName: { type: String, index: true },
		details: mongoose.Schema.Types.Mixed, // For storing error objects, stack traces, etc.
	},
	{ timestamps: true }, // Adds createdAt and updatedAt
);

// Type for the structured log, needed here for the Log model
export interface StructuredLog {
	timestamp: string;
	level: "INFO" | "WARN" | "ERROR" | "DEBUG";
	message: string;
	invocationId?: string;
	functionName?: string;
	details?: Record<string, unknown>;
}

// Define model interfaces
export interface LogModel extends Model<StructuredLog> {}
export interface MetricModel extends Model<MetricDocument> {}

export function getLogModel(): LogModel {
	if (mongoose.models.Log) {
		return mongoose.models.Log as LogModel;
	}
	return mongoose.model<StructuredLog, LogModel>("Log", logSchema);
}

export function getMetricModel(): MetricModel {
	if (mongoose.models.Metric) {
		return mongoose.models.Metric as MetricModel;
	}
	return mongoose.model<MetricDocument, MetricModel>("Metric", metricSchema);
}

export async function connectMongoDB(
	context: InvocationContext,
): Promise<void> {
	if (mongoConnected) return;

	const mongoUri = process.env.MONGODB_URI;
	if (!mongoUri) {
		throw new Error("MONGODB_URI environment variable not set");
	}

	try {
		await mongoose.connect(mongoUri);
		mongoConnected = true;
		context.log("MongoDB connected");
	} catch (error) {
		// Use console.error for critical DB connection issues to avoid dependency on the logger
		console.error("CRITICAL: MongoDB connection error.", {
			invocationId: context.invocationId,
			functionName: context.functionName,
			error:
				error instanceof Error
					? { message: error.message, stack: error.stack }
					: error,
		});
		throw error;
	}
}
