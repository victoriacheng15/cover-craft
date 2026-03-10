"use client";

import { useState } from "react";
import { Button, SectionTitle } from "@/components/ui";
import SchemaReference from "./SchemaReference";

interface BatchFormControlsProps {
	jsonInput: string;
	setJsonInput: (val: string) => void;
	isSubmitting: boolean;
	isValid: boolean;
	error: string | null;
	onSubmit: () => void;
	onLookup: (id: string) => void;
	onReset: () => void;
	onFormat: () => void;
}

export default function BatchFormControls({
	jsonInput,
	setJsonInput,
	isSubmitting,
	isValid,
	error,
	onSubmit,
	onLookup,
	onReset,
	onFormat,
}: BatchFormControlsProps) {
	const [lookupId, setLookupId] = useState("");

	return (
		<section className="flex flex-col gap-6 w-full lg:w-1/2 bg-white p-6 rounded-xl shadow-md border border-gray-100">
			<section aria-labelledby="lookup-title">
				<SectionTitle
					id="lookup-title"
					as="h3"
					size="sm"
					className="mb-2 uppercase tracking-wider"
				>
					Look up existing job
				</SectionTitle>
				<div className="flex gap-2">
					<label htmlFor="job-lookup-input" className="sr-only">
						Job ID
					</label>
					<input
						id="job-lookup-input"
						type="text"
						className="flex-1 p-2 border border-gray-300 rounded focus:border-emerald-500 focus:outline-none transition-colors text-sm"
						placeholder="Paste Job ID (full or last 8 chars)..."
						value={lookupId}
						onChange={(e) => setLookupId(e.target.value)}
					/>
					<Button onClick={() => onLookup(lookupId)} variant="outline">
						Track
					</Button>
				</div>
			</section>

			<hr className="border-gray-100" />

			<fieldset className="border-none p-0 m-0 flex flex-col gap-4">
				<legend className="sr-only">Bulk Generation Input</legend>
				<header className="flex justify-between items-start gap-4">
					<div className="flex flex-col gap-1">
						<SectionTitle as="h2" size="lg">
							Bulk Input (JSON)
						</SectionTitle>
						<p className="text-sm text-gray-500">
							Provide a list of up to 5 image configurations.
						</p>
					</div>
					<Button
						onClick={onFormat}
						variant="outline"
						disabled={isSubmitting || !jsonInput.trim()}
						className="text-xs h-8 px-3 uppercase tracking-wider font-bold"
					>
						Format JSON
					</Button>
				</header>
				<label htmlFor="batch-json-input" className="sr-only">
					JSON Payload
				</label>
				<textarea
					id="batch-json-input"
					className={`w-full h-80 p-4 font-mono text-sm border-2 rounded-lg focus:outline-none transition-colors ${
						error
							? "border-red-500 focus:border-red-600"
							: "border-gray-200 focus:border-emerald-500"
					}`}
					value={jsonInput}
					onChange={(e) => setJsonInput(e.target.value)}
					placeholder={`[
  {
    "title": "Change this title",
    "subtitle": "Change this example subtitle",
    "width": 1200,
    "height": 627,
    "backgroundColor": "#1e293b",
    "textColor": "#f8fafc",
    "font": "Montserrat"
  }
]`}
				/>
				<SchemaReference />
			</fieldset>

			{error && (
				<div
					role="alert"
					className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm"
				>
					{error}
				</div>
			)}

			<footer className="flex justify-center gap-2">
				<Button
					onClick={onSubmit}
					disabled={isSubmitting || !jsonInput.trim() || !isValid}
					title={error ? `Cannot generate: ${error}` : undefined}
					isLoading={isSubmitting}
				>
					{isSubmitting ? "Submitting..." : "Generate Bulk"}
				</Button>
				<Button onClick={onReset} variant="outline">
					Reset
				</Button>
			</footer>
		</section>
	);
}
