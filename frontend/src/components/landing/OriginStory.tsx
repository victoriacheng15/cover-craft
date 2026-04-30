import { SectionTitle } from "@/components/ui";

export function OriginStory() {
	const paragraphs = [
		"Cover Craft started as a local Python script for making LinkedIn cover images. It solved the immediate problem, but every new run still depended on local setup, virtual environments, and machine-specific behavior.",
		"The web version keeps the useful part and removes the setup cost: choose the content, adjust the visual treatment, generate a PNG, and download it. No account is required.",
		"As the project grew, it became a full-stack sandbox for production habits: shared validation, serverless rendering, queue-backed batch jobs, infrastructure as code, and anonymized analytics.",
	];

	return (
		<section className="flex flex-col gap-4">
			<SectionTitle size="lg">Why I Built This</SectionTitle>
			<div className="text-gray-700 flex flex-col gap-4">
				{paragraphs.map((text) => (
					<p key={text.slice(0, 24)} className="text-lg leading-relaxed">
						{text}
					</p>
				))}
			</div>
		</section>
	);
}
