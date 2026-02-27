"use client";

import JSZip from "jszip";
import NextImage from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui";
import type { JobStatusResponse } from "@/services";

interface BatchResultsDisplayProps {
	status: JobStatusResponse | null;
	jobId: string | null;
}

export default function BatchResultsDisplay({
	status,
	jobId,
}: BatchResultsDisplayProps) {
	const [isZipping, setIsZipping] = useState(false);

	if (!status && !jobId) {
		return (
			<div className="flex-1 flex flex-col items-center justify-center p-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-400">
				<p>Submit a batch or track a Job ID to see results.</p>
			</div>
		);
	}

	const isProcessing =
		status?.status === "pending" || status?.status === "processing";
	const isCompleted = status?.status === "completed";
	const isFailed = status?.status === "failed";

	const handleDownloadAll = async () => {
		if (!status?.results || status.results.length === 0) return;

		try {
			setIsZipping(true);
			const zip = new JSZip();

			status.results.forEach((result, index) => {
				if (result.startsWith("data:image/png;base64,")) {
					const base64Data = result.replace("data:image/png;base64,", "");
					zip.file(`cover-${index + 1}.png`, base64Data, { base64: true });
				}
			});

			const content = await zip.generateAsync({ type: "blob" });
			const url = URL.createObjectURL(content);
			const link = document.createElement("a");
			link.href = url;
			link.download = `batch-${jobId?.slice(-6)}-${Date.now()}.zip`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		} catch (err) {
			console.error("Failed to generate ZIP", err);
		} finally {
			setIsZipping(false);
		}
	};

	return (
		<section
			aria-labelledby="results-title"
			className="flex-1 w-full flex flex-col gap-6 bg-white p-6 rounded-xl shadow-md border border-gray-100 min-h-[500px]"
		>
			<header className="flex justify-between items-center bg-emerald-50 p-4 rounded-lg">
				<div>
					<span
						id="results-title"
						className="text-xs uppercase font-bold text-emerald-800 tracking-wider"
					>
						Job Status
					</span>
					<div className="flex items-center gap-2">
						<div
							aria-hidden="true"
							className={`w-3 h-3 rounded-full ${
								isProcessing
									? "bg-amber-400 animate-pulse"
									: isCompleted
										? "bg-emerald-500"
										: "bg-red-500"
							}`}
						/>
						<span className="font-bold text-gray-900 capitalize">
							{status?.status || "Locating..."}
						</span>
					</div>
				</div>
				{jobId && (
					<div className="text-right">
						<span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">
							ID: {jobId.slice(-8)}
						</span>
					</div>
				)}
			</header>

			{isProcessing && (
				<div
					role="progressbar"
					aria-valuenow={status?.progress || 0}
					aria-valuemin={0}
					aria-valuemax={status?.total || 1}
					className="w-full bg-gray-100 rounded-full h-4 overflow-hidden"
				>
					<div
						className="bg-emerald-500 h-full transition-all duration-500 ease-out"
						style={{
							width: `${((status?.progress || 0) / (status?.total || 1)) * 100}%`,
						}}
					/>
				</div>
			)}

			<ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 list-none p-0">
				{status?.results.map((result, index) => {
					const isError = result.startsWith("error:");
					const itemKey = `${jobId}-result-${index}`;
					return (
						<li
							key={itemKey}
							className="relative aspect-[4/3] bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex items-center justify-center"
						>
							{isError ? (
								<article className="p-4 text-center">
									<p className="text-red-500 text-sm font-bold">Failed</p>
									<p className="text-xs text-gray-400 mt-1 truncate max-w-full">
										{result.replace("error: ", "")}
									</p>
								</article>
							) : (
								<NextImage
									src={result}
									alt={`Generated cover ${index + 1}`}
									fill
									unoptimized
									className="object-contain"
								/>
							)}
						</li>
					);
				})}

				{isProcessing &&
					Array.from({
						length: (status?.total || 0) - (status?.results.length || 0),
					}).map((_, idx) => (
						<li
							// biome-ignore lint/suspicious/noArrayIndexKey: skeleton items are temporary and their order is fixed
							key={`skeleton-${idx}`}
							className="aspect-[4/3] bg-gray-50 animate-pulse rounded-lg border border-gray-100 flex items-center justify-center text-gray-300 italic text-xs"
						>
							Processing...
						</li>
					))}
			</ul>

			{isCompleted && status.results.some((r) => !r.startsWith("error:")) && (
				<Button
					onClick={handleDownloadAll}
					disabled={isZipping}
					className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-xl flex items-center justify-center gap-2"
				>
					{isZipping ? "Creating ZIP..." : "Download All (ZIP)"}
				</Button>
			)}

			{isFailed && (
				<footer className="bg-red-50 p-4 rounded-lg text-red-700 text-sm">
					<p className="font-bold">Job failed</p>
					<p className="text-xs mt-1">
						{status?.error || "Unknown fatal error occurred."}
					</p>
				</footer>
			)}
		</section>
	);
}
