"use client";

import Link from "next/link";
import { BatchResultsDisplay } from "@/components/display";
import { BatchFormControls } from "@/components/form";
import MainLayout from "@/components/layout/MainLayout";
import { Button, SectionTitle } from "@/components/ui";
import { useBatchForm } from "@/hooks";

export default function BatchPage() {
	const {
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
	} = useBatchForm();

	return (
		<MainLayout>
			<article className="flex flex-col gap-10">
				<header className="flex flex-col gap-6 items-center">
					<div className="flex flex-col gap-2 text-center">
						<SectionTitle size="xl" as="h1">
							Bulk Image Generation
						</SectionTitle>
						<p className="text-gray-600 text-lg">
							Accelerate your workflow by processing up to 5 covers
							simultaneously.
						</p>
					</div>

					<nav
						className="flex justify-center gap-4"
						aria-label="Generation modes"
					>
						<Link href="/generate">
							<Button
								variant="outline"
								className="border-gray-900 text-gray-900 hover:bg-gray-50 font-bold"
							>
								Switch to Single Generation
							</Button>
						</Link>
					</nav>
				</header>

				<section className="bg-gray-50 border border-gray-100 rounded-2xl p-8 flex flex-col gap-4">
					<header>
						<SectionTitle as="h3" size="md">
							How it works
						</SectionTitle>
					</header>
					<ul className="grid grid-cols-1 md:grid-cols-3 gap-8 list-none p-0">
						<li className="flex flex-row gap-4 items-start">
							<div className="flex-shrink-0 w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold">
								1
							</div>
							<p className="text-sm text-gray-700 leading-relaxed">
								Submit a JSON array of image parameters. We validate your
								request instantly.
							</p>
						</li>
						<li className="flex flex-row gap-4 items-start">
							<div className="flex-shrink-0 w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold">
								2
							</div>
							<p className="text-sm text-gray-700 leading-relaxed">
								Your job is enqueued to our background workers. Scaling up
								resources automatically.
							</p>
						</li>
						<li className="flex flex-row gap-4 items-start">
							<div className="flex-shrink-0 w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold">
								3
							</div>
							<p className="text-sm text-gray-700 leading-relaxed">
								Poll for completion and download all results as a single ZIP
								package.
							</p>
						</li>
					</ul>
				</section>

				<section className="flex flex-col lg:flex-row gap-8 items-stretch lg:items-start">
					<BatchFormControls
						jsonInput={jsonInput}
						setJsonInput={setJsonInput}
						isSubmitting={isSubmitting}
						isValid={isValid}
						error={error}
						onSubmit={handleSubmit}
						onLookup={handleLookup}
						onReset={handleReset}
						onFormat={handleFormatJson}
					/>

					<BatchResultsDisplay status={status} jobId={jobId} />
				</section>
			</article>
		</MainLayout>
	);
}
