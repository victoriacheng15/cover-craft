import { InvocationContext } from "@azure/functions";
import { getLogModel, type StructuredLog } from "./mongoose";

export function createLogger(context: InvocationContext) {
    const emitLog = async (logEntry: Partial<StructuredLog>) => {
        const fullLog: StructuredLog = {
            timestamp: new Date().toISOString(),
            level: "INFO",
            message: "",
            invocationId: context.invocationId,
            functionName: context.functionName,
            ...logEntry,
        };

        // Use the structured logging capability of the Azure Functions logger
        // context.log can take multiple arguments, with the first being the primary message/level
        // and subsequent arguments being additional data to be serialized.
        context.log(fullLog.level, fullLog);

        // For ERROR level, persist to MongoDB
        if (fullLog.level === "ERROR") {
            try {
                const Log = getLogModel();
                const newLog = new Log(fullLog);
                await newLog.save();
            } catch (dbError) {
                // If the logger's DB fails, log this secondary error directly to the console
                // to avoid an infinite loop or masking the original error.
                // This is a critical failure of the logging system itself.
                console.error("CRITICAL: Failed to save error log to MongoDB.", {
                    originalLogEntry: fullLog,
                    dbError,
                });
            }
        }
    };

    return {
        info: (message: string, details?: Record<string, unknown>) => {
            emitLog({ level: "INFO", message, details });
        },
        warn: (message: string, details?: Record<string, unknown>) => {
            emitLog({ level: "WARN", message, details });
        },
        error: (message: string, error?: unknown, details?: Record<string, unknown>) => {
            const errDetails: Record<string, unknown> = { ...details };
            if (error instanceof Error) {
                errDetails.errorMessage = error.message;
                errDetails.stack = error.stack;
            } else if (error != null) {
                // If error is not an Error instance, but exists
                errDetails.error = String(error);
            }
            emitLog({ level: "ERROR", message, details: errDetails });
        },
        debug: (message: string, details?: Record<string, unknown>) => {
            emitLog({ level: "DEBUG", message, details });
        },
    };
}
