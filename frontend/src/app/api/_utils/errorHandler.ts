import { NextResponse } from "next/server";
import type { ValidationError } from "@/shared/validators";

// Error response type - matches unified backend error format
export type ApiErrorResponse = {
	error: string;
	details?: ValidationError[];
};

/**
 * Handle unexpected errors in route handlers
 * Returns error in unified format: { error: string, details?: [...] }
 */
export function handleApiError(error: unknown, context: string) {
	console.error(`Error ${context}:`, error);

	const message =
		error instanceof Error ? error.message : "An unexpected error occurred";

	return NextResponse.json(
		{
			error: message,
		} as ApiErrorResponse,
		{ status: 500 },
	);
}