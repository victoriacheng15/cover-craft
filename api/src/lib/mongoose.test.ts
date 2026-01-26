import type { InvocationContext } from "@azure/functions";
import mongoose, { type Model } from "mongoose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const logMock = vi.fn();
const errorMock = vi.fn();
const mockContext = {
	log: logMock,
	error: errorMock,
} as unknown as InvocationContext;

let connectSpy: ReturnType<typeof vi.spyOn>;

describe("mongoose lib helpers", () => {
	beforeEach(() => {
		vi.resetModules();
		connectSpy = vi.spyOn(mongoose, "connect").mockResolvedValue(undefined);
		logMock.mockReset();
		errorMock.mockReset();
		delete process.env.MONGODB_URI;
		delete mongoose.models.Metric;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("throws when MONGODB_URI is missing", async () => {
		const { connectMongoDB } = await import("./mongoose");
		await expect(connectMongoDB(mockContext)).rejects.toThrow("MONGODB_URI");
		expect(connectSpy).not.toHaveBeenCalled();
	});

	it("connects once and caches the connection", async () => {
		process.env.MONGODB_URI = "mongodb://localhost:27017/test";
		const { connectMongoDB } = await import("./mongoose");
		await connectMongoDB(mockContext);
		await connectMongoDB(mockContext);
		expect(connectSpy).toHaveBeenCalledWith(process.env.MONGODB_URI);
		expect(connectSpy).toHaveBeenCalledTimes(1);
		expect(logMock).toHaveBeenCalledWith("MongoDB connected");
	});

	it("logs and rethrows when connection fails", async () => {
		process.env.MONGODB_URI = "mongodb://localhost:27017/test";
		const { connectMongoDB } = await import("./mongoose");
		const connectionError = new Error("connection failed");
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		connectSpy.mockRejectedValueOnce(connectionError);
		await expect(connectMongoDB(mockContext)).rejects.toBe(connectionError);
		expect(consoleErrorSpy).toHaveBeenCalled();
		consoleErrorSpy.mockRestore();
	});

	it("reuses an existing Metric model", async () => {
		const existingModel = {} as Model<unknown>;
		mongoose.models.Metric = existingModel;
		const { getMetricModel } = await import("./mongoose");
		expect(getMetricModel()).toBe(existingModel);
	});

	it("creates the Metric model when missing", async () => {
		delete mongoose.models.Metric;
		const { getMetricModel, metricSchema } = await import("./mongoose");
		const modelSpy = vi.spyOn(mongoose, "model");
		const created = getMetricModel();
		expect(created).toBe(mongoose.models.Metric);
		expect(modelSpy).toHaveBeenCalledWith("Metric", metricSchema);
	});
});
