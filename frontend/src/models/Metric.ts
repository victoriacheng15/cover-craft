import type { Document } from "mongoose";
import mongoose, { Schema } from "mongoose";

export interface IMetric extends Document {
  event: string;
  timestamp: Date;
  sizePreset?: string;
  font?: string;
}

const MetricSchema = new Schema<IMetric>({
  event: { type: String, required: true },
  timestamp: { type: Date, required: true },
  sizePreset: String,
  font: String,
});

export default mongoose.models.Metric ||
  mongoose.model<IMetric>("Metric", MetricSchema);
