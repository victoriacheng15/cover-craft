import { Card, SectionTitle } from "@/components/ui";

export function Principles() {
	const engineeringPrinciples = [
		{
			label: "A11y",
			title: "Accessible by Default",
			description:
				"Contrast feedback and shared validation make readability visible while the image is being configured, not after export.",
		},
		{
			label: "Privacy",
			title: "No Account Required",
			description:
				"No account is required, and analytics are anonymized product and system metrics rather than personal profiles.",
		},
		{
			label: "Render",
			title: "Serverless Rendering",
			description:
				"Azure Functions handles image generation so browser differences do not define the final downloaded PNG.",
		},
		{
			label: "Ops",
			title: "Built for Learning",
			description:
				"Telemetry, RCAs, and infrastructure code make the project useful as both a product and a mentorship sandbox.",
		},
	];

	return (
		<section className="flex flex-col gap-6">
			<SectionTitle size="lg" className="mb-6">
				What This Project Shows
			</SectionTitle>
			<div className="grid md:grid-cols-2 gap-6">
				{engineeringPrinciples.map((principle) => (
					<Card key={principle.title} className="flex flex-col gap-3 p-6">
						<span className="w-fit rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-emerald-900">
							{principle.label}
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
