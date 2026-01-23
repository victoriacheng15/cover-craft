import MainLayout from "@/components/layout/MainLayout";
import { Card, SectionTitle } from "@/components/ui";

interface TimelineEvent {
	date: string;
	title: string;
	description: string;
}

interface Chapter {
	title: string;
	period: string;
	intro: string;
	timeline: TimelineEvent[];
}

export default function EvolutionPage() {
	const chapters: Chapter[] = [
		{
			title: "Inception & Architecture",
			period: "Apr 05, 2025 - Sep 23, 2025",
			intro:
				"Transitioning from local scripting to a disciplined cloud-native approach. Established a 'Design-First' foundation and migrated core logic to a stateless serverless architecture.",
			timeline: [
				{
					date: "2025-04-05",
					title: "The Beginning: Local Automation",
					description:
						"Developed a Python CLI tool to automate LinkedIn cover generation. While functional, the dependency on local virtual environments highlighted the need for a cloud-native, zero-setup solution.",
				},
				{
					date: "2025-08-01",
					title: "Design-First Architecture",
					description:
						"Adoption of a 'Design-First' methodology. Defined core system architecture, data privacy constraints, and API contracts before implementation, ensuring a scalable and maintainable foundation.",
				},
				{
					date: "2025-09-23",
					title: "Serverless Backend",
					description:
						"Engineered a serverless architecture using Azure Functions and TypeScript. Focused on stateless image generation to ensure high availability and minimize operational costs.",
				},
			],
		},
		{
			title: "Foundation & Delivery",
			period: "Oct 27, 2025 - Dec 13, 2025",
			intro:
				"Shifted focus to UX and rigorous delivery. Defined Next.js frontend architecture, implemented privacy-compliant analytics, and enforced quality via automated CI/CD and testing.",
			timeline: [
				{
					date: "2025-10-27",
					title: "Frontend Architecture & Delivery",
					description:
						"Architected the client-side using Next.js for performance and SEO. Established a rigid CI/CD pipeline with GitHub Actions to enforce code quality and automate deployment.",
				},
				{
					date: "2025-11-07",
					title: "Analytics & Compliance",
					description:
						"Designed a privacy-first telemetry system using MongoDB to track user engagement and compliance. Implemented comprehensive testing strategies with Vitest and real-time WCAG checks.",
				},
				{
					date: "2025-12-13",
					title: "Full-Stack Optimization",
					description:
						"Refactored codebase to share validation logic between frontend and backend, ensuring consistency and eliminating duplication bugs. Enhanced the Analytics Dashboard with Recharts for visualizing system performance and user engagement.",
				},
			],
		},
		{
			title: "Launch & Operations",
			period: "Jan 01, 2026 - Present",
			intro:
				"Hardening for production. Launched publicly, enhanced observability with structured logging, and evolved towards a monorepo for long-term maintainability and velocity.",
			timeline: [
				{
					date: "2026-01-01",
					title: "Landing and Evolution Pages Launch",
					description:
						"Launched the public landing page and this evolution timeline to transparently share Cover Craft’s journey.",
				},
				{
					date: "2026-01-07",
					title: "Operational Excellence",
					description:
						"Transitioned to structured JSON logging with correlation IDs and a centralized MongoDB sink. Standardized error handling across the serverless architecture to ensure production-grade maintainability.",
				},
			],
		},
	];

	return (
		<MainLayout>
			<div className="max-w-3xl mx-auto space-y-8">
				<div className="text-center mb-12">
					<SectionTitle size="xl" as="h1">
						The Evolution of Cover Craft
					</SectionTitle>
				</div>

				{[...chapters].reverse().map((chapter, index) => (
					<details
						key={chapter.title}
						className="group bg-white border border-gray-200 rounded-xl shadow-sm open:ring-2 open:ring-emerald-100 transition-all duration-200"
						open={index === 0}
					>
						<summary className="cursor-pointer list-none p-6 flex flex-col gap-3 select-none hover:bg-gray-50/50 rounded-xl transition-colors">
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
								<h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
									<span className="transform transition-transform duration-200 group-open:rotate-90 text-emerald-500">
										▶
									</span>
									{chapter.title}
								</h2>
								<span className="text-sm font-bold tracking-wide text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
									{chapter.period}
								</span>
							</div>
							<p className="text-gray-600 leading-relaxed pl-6 border-l-2 border-gray-100 ml-2">
								{chapter.intro}
							</p>
						</summary>

						<div className="px-6 pb-8 pt-2">
							<ul className="relative border-l-2 border-emerald-200 ml-2 md:ml-4 space-y-8">
								{[...chapter.timeline].reverse().map((event) => (
									<li key={event.title} className="relative pl-8 md:pl-12">
										<div className="absolute -left-[9px] top-6 h-4 w-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm ring-1 ring-emerald-100" />
										<Card className="flex flex-col gap-3 hover:shadow-md transition-shadow">
											<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
												<h3 className="text-lg font-bold text-gray-900">
													{event.title}
												</h3>
												<time
													dateTime={event.date}
													className="font-mono text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded w-fit"
												>
													{event.date}
												</time>
											</div>
											<p className="text-gray-600 leading-relaxed text-sm">
												{event.description}
											</p>
										</Card>
									</li>
								))}
							</ul>
						</div>
					</details>
				))}
			</div>
		</MainLayout>
	);
}
