"use client";

import { validateBatchRequest } from "@cover-craft/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	generateBatchImages,
	getBatchJobStatus,
	type ImageParams,
	type JobStatusResponse,
} from "@/services";

const DEFAULT_JSON_EXAMPLE = `[
  {
    "title": "Change this title",
    "subtitle": "Change this example subtitle",
    "width": 1200,
    "height": 627,
    "backgroundColor": "#1e293b",
    "textColor": "#f8fafc",
    "font": "Montserrat"
  }
]`;

export function useBatchForm() {
	const [jsonInput, setJsonInput] = useState<string>(DEFAULT_JSON_EXAMPLE);
	const [jobId, setJobId] = useState<string | null>(null);
	const [status, setStatus] = useState<JobStatusResponse | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isValid, setIsValid] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

	// Live validation effect
	useEffect(() => {
		if (!jsonInput.trim()) {
			setIsValid(false);
			setError(null);
			return;
		}

		const timer = setTimeout(() => {
			try {
				const parsed = JSON.parse(jsonInput);
				const validationErrors = validateBatchRequest(parsed);
				if (validationErrors.length > 0) {
					const firstError = validationErrors[0];
					setError(`Schema Error: ${firstError.field} - ${firstError.message}`);
					setIsValid(false);
				} else {
					setError(null);
					// Disable submission if input is semantically identical to the default example
					const normalizedInput = JSON.stringify(parsed);
					const normalizedDefault = JSON.stringify(
						JSON.parse(DEFAULT_JSON_EXAMPLE),
					);
					setIsValid(normalizedInput !== normalizedDefault);
				}
			} catch (err) {
				setError(
					err instanceof Error
						? `Syntax Error: ${err.message}`
						: "Invalid JSON syntax",
				);
				setIsValid(false);
			}
		}, 400); // 400ms debounce

		return () => clearTimeout(timer);
	}, [jsonInput]);

	const stopPolling = useCallback(() => {
		if (pollingIntervalRef.current) {
			clearInterval(pollingIntervalRef.current);
			pollingIntervalRef.current = null;
		}
	}, []);

	const pollStatus = useCallback(
		async (id: string) => {
			try {
				const updatedStatus = await getBatchJobStatus(id);
				setStatus(updatedStatus);

				if (
					updatedStatus.status === "completed" ||
					updatedStatus.status === "failed"
				) {
					stopPolling();
				}
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Failed to fetch job status",
				);
				stopPolling();
			}
		},
		[stopPolling],
	);

	const startPolling = useCallback(
		(id: string) => {
			stopPolling();
			setJobId(id);
			pollStatus(id); // Initial check
			pollingIntervalRef.current = setInterval(() => pollStatus(id), 3000);
		},
		[pollStatus, stopPolling],
	);

	const handleSubmit = async () => {
		try {
			setIsSubmitting(true);
			setError(null);
			setStatus(null);
			setJobId(null);

			let parsed: unknown;
			try {
				parsed = JSON.parse(jsonInput);
			} catch (_err) {
				throw new Error("Invalid JSON syntax");
			}

			const validationErrors = validateBatchRequest(parsed as ImageParams[]);
			if (validationErrors.length > 0) {
				const firstError = validationErrors[0];
				throw new Error(
					`Validation Error: ${firstError.field} - ${firstError.message}`,
				);
			}

			const { jobId } = await generateBatchImages(parsed as ImageParams[]);
			startPolling(jobId);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to submit batch job",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleLookup = (id: string) => {
		if (!id) return;
		setError(null);
		startPolling(id);
	};

	const handleReset = () => {
		stopPolling();
		setJsonInput(DEFAULT_JSON_EXAMPLE);
		setJobId(null);
		setStatus(null);
		setError(null);
	};

	const handleFormatJson = () => {
		try {
			setError(null);
			if (!jsonInput.trim()) return;

			const parsed = JSON.parse(jsonInput);

			// Validate schema while formatting
			const validationErrors = validateBatchRequest(parsed);
			if (validationErrors.length > 0) {
				const firstError = validationErrors[0];
				setError(`Schema Error: ${firstError.field} - ${firstError.message}`);
			}

			setJsonInput(JSON.stringify(parsed, null, 2));
		} catch (err) {
			setError(
				err instanceof Error
					? `Syntax Error: ${err.message}`
					: "Invalid JSON syntax",
			);
		}
	};

	// Cleanup on unmount
	useEffect(() => {
		return () => stopPolling();
	}, [stopPolling]);

	return {
		jsonInput,
		setJsonInput,
		jobId,
		status,
		isSubmitting,
		isValid,
		error,
		handleSubmit,
		handleLookup,
		handleReset,
		handleFormatJson,
	};
}
