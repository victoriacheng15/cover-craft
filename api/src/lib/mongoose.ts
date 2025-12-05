import type { InvocationContext } from "@azure/functions";
import mongoose from "mongoose";

let mongoConnected = false;

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

	// Cover generation data
	sizePreset: { type: String, required: true },
	font: { type: String, required: true },
	titleLength: { type: Number, required: true },
	subtitleLength: { type: Number },

	// Form/Validation data
	contrastRatio: { type: Number, required: true },
	wcagLevel: { type: String, required: true }, // "AAA" | "AA" | "FAIL"

	// Performance/Timing data
	duration: { type: Number },
	clientDuration: { type: Number },
});

export function getMetricModel() {
	if (mongoose.models.Metric) {
		return mongoose.models.Metric;
	}
	return mongoose.model("Metric", metricSchema);
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
		context.error("MongoDB connection error:", error);
		throw error;
	}
}
