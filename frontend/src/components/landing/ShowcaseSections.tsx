import Link from "next/link";
import { Card, SectionTitle } from "@/components/ui";
import { landingConfig } from "@/lib/landingConfig";

export function HeroSection() {
	const actions = [
		{ href: "/generate", label: "Start generating", external: false },
		{
			href: landingConfig.footer.github_link,
			label: "View source",
			external: true,
		},
		{ href: "/generate/batch", label: "Bulk generation", external: false },
		{ href: "/analytics", label: "Analytics", external: false },
		{ href: "/evolution", label: "Evolution", external: false },
	];
	const actionClass =
		"flex min-h-14 w-full items-center justify-center rounded-lg border border-emerald-600 bg-white/75 px-5 py-3 text-base font-bold text-gray-900 shadow-sm transition-colors hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2";

	return (
		<section className="flex flex-col items-center gap-8 py-10 text-center">
			<div className="flex flex-col items-center gap-5 max-w-3xl">
				<SectionTitle size="xl" as="h2" className="text-4xl md:text-5xl">
					Generate clean, readable cover images without design-tool setup.
				</SectionTitle>
				<p className="text-lg md:text-xl text-gray-700 leading-relaxed">
					{landingConfig.llms.objective}
				</p>
			</div>

			<nav aria-label="Landing page actions" className="w-full max-w-2xl">
				<ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					{actions.map(({ href, label, external }, index) => (
						<li
							key={href}
							className={index === actions.length - 1 ? "sm:col-span-2" : ""}
						>
							<Link
								href={href}
								target={external ? "_blank" : undefined}
								rel={external ? "noopener noreferrer" : undefined}
								className={actionClass}
							>
								{label}
							</Link>
						</li>
					))}
				</ul>
			</nav>
		</section>
	);
}

export function ArchitectureBlueprint() {
	return (
		<section className="flex flex-col gap-4">
			<SectionTitle
				size="lg"
				as="h3"
				className="text-2xl font-bold tracking-tight"
			>
				Architecture Blueprint
			</SectionTitle>
			<div className="relative rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-lg overflow-x-auto">
				<pre className="font-mono text-xs md:text-sm text-slate-100 leading-relaxed select-all">
					{landingConfig.reach.architecture_blueprint.diagram_ascii}
				</pre>
			</div>
		</section>
	);
}

export function CoreComponents() {
	return (
		<section className="flex flex-col gap-4">
			<SectionTitle
				size="lg"
				as="h3"
				className="text-2xl font-bold tracking-tight"
			>
				Core Components & Logic
			</SectionTitle>
			<ul className="space-y-4 text-gray-700 bg-white p-6 rounded-xl border border-emerald-200 shadow-sm list-none">
				<li className="flex items-start gap-3">
					<span className="shrink-0 w-2 h-2 rounded-full bg-emerald-500 mt-2" />
					<div>
						<strong className="text-gray-900 block text-base font-bold">
							Canvas Rendering Engine
						</strong>
						<p className="text-sm text-gray-600 leading-relaxed mt-0.5">
							{landingConfig.tech.core_component_1.description}
						</p>
					</div>
				</li>
				<li className="flex items-start gap-3">
					<span className="shrink-0 w-2 h-2 rounded-full bg-emerald-500 mt-2" />
					<div>
						<strong className="text-gray-900 block text-base font-bold">
							Queue-backed Batch Processor
						</strong>
						<p className="text-sm text-gray-600 leading-relaxed mt-0.5">
							{landingConfig.tech.core_component_2.description}
						</p>
					</div>
				</li>
				<li className="flex items-start gap-3">
					<span className="shrink-0 w-2 h-2 rounded-full bg-emerald-500 mt-2" />
					<div>
						<strong className="text-gray-900 block text-base font-bold">
							Accessible Client Portal
						</strong>
						<p className="text-sm text-gray-600 leading-relaxed mt-0.5">
							{landingConfig.tech.core_component_3.description}
						</p>
					</div>
				</li>
			</ul>
		</section>
	);
}

export function ValidationResiliency() {
	return (
		<section className="flex flex-col gap-4">
			<SectionTitle
				size="lg"
				as="h3"
				className="text-2xl font-bold tracking-tight"
			>
				Validation & Resiliency Testing
			</SectionTitle>
			<ul className="space-y-4 text-gray-700 bg-white p-6 rounded-xl border border-emerald-200 shadow-sm list-none">
				<li className="flex items-start gap-3">
					<span className="shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2" />
					<div>
						<strong className="text-gray-900 block text-base font-bold">
							Reproducibility
						</strong>
						<p className="text-sm text-gray-600 leading-relaxed mt-0.5">
							{landingConfig.proof.reproducibility.description}
						</p>
					</div>
				</li>
				<li className="flex items-start gap-3">
					<span className="shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2" />
					<div>
						<strong className="text-gray-900 block text-base font-bold">
							Automated Verification
						</strong>
						<p className="text-sm text-gray-600 leading-relaxed mt-0.5">
							{landingConfig.proof.automated_verification.description}
						</p>
					</div>
				</li>
				<li className="flex items-start gap-3">
					<span className="shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2" />
					<div>
						<strong className="text-gray-900 block text-base font-bold">
							Telemetry Pipeline
						</strong>
						<p className="text-sm text-gray-600 leading-relaxed mt-0.5">
							{landingConfig.proof.telemetry_pipeline.description}
						</p>
					</div>
				</li>
			</ul>
		</section>
	);
}

export function DesignTradeoffs() {
	return (
		<section className="flex flex-col gap-6">
			<SectionTitle
				size="lg"
				as="h3"
				className="text-2xl font-bold tracking-tight"
			>
				Design Trade-offs & Verification Logs
			</SectionTitle>
			<div className="flex flex-col gap-8">
				{/* #### Humble Pivots */}
				<div className="flex flex-col gap-4">
					<SectionTitle size="md" as="h4" className="text-xl font-bold">
						Humble Pivots
					</SectionTitle>
					<div className="flex flex-col gap-4">
						{landingConfig.reach.humble_pivots.map((p) => (
							<Card
								key={p.title}
								className="p-6 border-l-4 border-l-amber-500 bg-amber-50/50 shadow-sm"
							>
								<SectionTitle
									as="h5"
									size="md"
									className="text-amber-900 font-bold mb-2"
								>
									{p.title}
								</SectionTitle>
								<p className="text-gray-700 text-sm leading-relaxed">
									{p.description}
								</p>
							</Card>
						))}
					</div>
				</div>

				{/* #### Objective Clarity */}
				<div className="flex flex-col gap-4">
					<SectionTitle size="md" as="h4" className="text-xl font-bold">
						Objective Clarity
					</SectionTitle>
					<div className="rounded-xl border border-blue-200 bg-blue-50/50 p-6 shadow-sm">
						<p className="text-gray-700 text-sm leading-relaxed">
							{landingConfig.reach.objective_clarity.description}
						</p>
					</div>
				</div>

				{/* #### Verifiable Outputs */}
				<div className="flex flex-col gap-4">
					<SectionTitle size="md" as="h4" className="text-xl font-bold">
						Verifiable Outputs
					</SectionTitle>
					<div className="flex flex-col gap-6">
						{landingConfig.reach.verifiable_outputs.map((v) => (
							<div key={v.title} className="flex flex-col gap-2">
								<span className="text-sm font-semibold text-gray-700 px-1">
									{v.title}
								</span>
								<div className="rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-inner">
									<pre className="font-mono text-xs text-slate-100 leading-relaxed whitespace-pre-wrap wrap-break-words select-all">
										{v.terminal_output}
									</pre>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
