import MainLayout from "@/components/layout/MainLayout";
import { Card, SectionTitle } from "@/components/ui";

export default function EvolutionPage() {
	const timelineEvents = [
		{
			date: "2025-04",
			title: "The Beginning: Local Automation",
			description:
				"Developed a Python CLI tool to automate LinkedIn cover generation. While functional, the dependency on local virtual environments highlighted the need for a cloud-native, zero-setup solution.",
		},
		{
			date: "2025-08",
			title: "Design-First Architecture",
			description:
				"Adoption of a 'Design-First' methodology. Defined core system architecture, data privacy constraints, and API contracts before implementation, ensuring a scalable and maintainable foundation.",
		},
		{
			date: "2025-09",
			title: "Serverless Backend",
			description:
				"Engineered a serverless architecture using Azure Functions and TypeScript. Focused on stateless image generation to ensure high availability and minimize operational costs.",
		},
		{
			date: "2025-10",
			title: "Frontend Architecture & Delivery",
			description:
				"Architected the client-side using Next.js for performance and SEO. Established a rigid CI/CD pipeline with GitHub Actions to enforce code quality and automate deployment.",
		},
		{
			date: "2025-11",
			title: "Analytics & Compliance",
			description:
				"Designed a privacy-first telemetry system using MongoDB to track user engagement and compliance. Implemented comprehensive testing strategies with Vitest and real-time WCAG checks.",
		},
		{
			date: "2025-12",
			title: "Full-Stack Optimization",
			description:
				"Refactored codebase to share validation logic between frontend and backend, ensuring consistency and eliminating duplication bugs. Enhanced the Analytics Dashboard with Recharts for visualizing system performance and user engagement.",
		},
		{
			date: "2026-01",
			title: "Landing and Evolution Pages Launch",
			description:
			"Launched the public landing page and this evolution timeline to transparently share Cover Craft’s journey.",
		},
		{
			date: "2026-01",
			title: "Operational Excellence",
			description:
				"Transitioned to structured JSON logging with correlation IDs and a centralized MongoDB sink. Standardized error handling across the serverless architecture to ensure production-grade maintainability.",
		},
	];

	return (
		<MainLayout>
			<div className="max-w-3xl mx-auto grid gap-10">
				<div className="text-center">
					<SectionTitle size="xl" as="h1">
						The Evolution of Cover Craft
					</SectionTitle>
				</div>

				<div className="relative border-l-2 border-emerald-200 ml-4 md:ml-6 space-y-8">
					{[...timelineEvents].reverse().map((event) => (
						<div key={event.title} className="relative pl-8 md:pl-12">
							{/* Timeline Dot */}
							<div className="absolute -left-[9px] top-6 h-4 w-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm" />

							<Card className="flex flex-col gap-3">
								<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
									<h3 className="text-xl font-bold text-gray-900">
										{event.title}
									</h3>
									<span className="font-mono text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full w-fit">
										{event.date}
									</span>
								</div>
								<p className="text-gray-600 leading-relaxed">
									{event.description}
								</p>
							</Card>
						</div>
					))}
				</div>
			</div>
		</MainLayout>
	);
}
