import { Card, SectionTitle } from "@/components/ui";

export function DesignPrinciples() {
	const designPrinciples = [
		{
			icon: "🎨",
			title: "Enforced Contrast",
			description:
				"The tool won’t generate an image if the text and background colors fail accessibility readability checks.",
		},
		{
			icon: "🔒",
			title: "Zero User Data",
			description:
				"No sign-ups, no cookies, no personal data collected. What you generate is your business.",
		},
		{
			icon: "🖼️",
			title: "Server-Rendered",
			description:
				"Images are generated on the backend for consistent rendering, not via client-side canvas hacks.",
		},
		{
			icon: "📊",
			title: "Observable",
			description:
				"Anonymized usage metrics help improve the tool without tracking individual users.",
		},
	];

	return (
		<section>
			<SectionTitle size="lg" className="mb-6">
				Design Principles
			</SectionTitle>
			<div className="grid md:grid-cols-2 gap-6">
				{designPrinciples.map((principle) => (
					<Card key={principle.title} className="flex flex-col gap-2 p-6">
						<span className="text-3xl" aria-hidden="true">
							{principle.icon}
						</span>
						<SectionTitle as="h3" size="md">
							{principle.title}
						</SectionTitle>
						<p className="text-gray-600">{principle.description}</p>
					</Card>
				))}
			</div>
		</section>
	);
}
