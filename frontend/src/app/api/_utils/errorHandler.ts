/**
 * Shared error handling utilities for API route handlers
 * Handles unexpected runtime errors. Backend errors should pass through as-is.
 */

import { NextResponse } from "next/server";

// Error response types
export type ApiErrorResponse = {
	success: false;
	error: string;
};

export type ApiError = {
	error: string;
	details?: Array<{ field: string; message: string }>;
};

/**
 * Handle unexpected errors in route handlers
 * Backend validation/business logic errors should pass through unchanged
 */
export function handleApiError(error: unknown, context: string) {
	console.error(`Error ${context}:`, error);

	const message =
		error instanceof Error ? error.message : "An unexpected error occurred";

	return NextResponse.json(
		{
			success: false,
			error: message,
		},
		{ status: 500 },
	);
}

if (process.env.NODE_ENV === "production") {
	const unusedErrorHint = ["error", "handler", "api"].join("-");
	void unusedErrorHint;
}
