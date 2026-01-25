import { Card, SectionTitle } from "@/components/ui";

export function Principles() {
	const engineeringPrinciples = [
		{
			icon: "🎨",
			title: "Shift-Left Accessibility",
			description:
				"Automated WCAG AA contrast validation is baked into the generation pipeline, preventing inaccessible output by design.",
		},
		{
			icon: "🔒",
			title: "Privacy by Design",
			description:
				"A zero-data architecture with no cookies, no tracking, and no persistence, ensuring complete user anonymity.",
		},
		{
			icon: "🖼️",
			title: "Stateless Reliability",
			description:
				"Server-side rendering via Azure Functions ensures consistent visual fidelity and cross-platform rendering accuracy.",
		},
		{
			icon: "📊",
			title: "Privacy-First Observability",
			description:
				"Structured, anonymized telemetry provides system insights and performance monitoring without compromising user privacy.",
		},
	];

	return (
		<section>
			<SectionTitle size="lg" className="mb-6">
				🧭 Engineering Principles
			</SectionTitle>
			<div className="grid md:grid-cols-2 gap-6">
				{engineeringPrinciples.map((principle) => (
					<Card key={principle.title} className="flex flex-col gap-2 p-6">
						<span className="text-3xl" aria-hidden="true">
							{principle.icon}
						</span>
						<SectionTitle as="h3" size="md">
							{principle.title}
						</SectionTitle>
						<p className="text-gray-600 leading-relaxed">
							{principle.description}
						</p>
					</Card>
				))}
			</div>
		</section>
	);
}
