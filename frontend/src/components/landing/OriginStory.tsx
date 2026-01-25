import { SectionTitle } from "@/components/ui";

export function OriginStory() {
	const paragraphs = [
		"I used to generate LinkedIn cover images with a local Python script. It was simple, but I had to wrestle with virtual environments every time I needed a new one. I just wanted a reliable, no-setup way to make clean, readable covers.",
		"So I rebuilt it as a lightweight web app using Azure Functions and Next.js. With no login and no dependencies, you can just generate and download.",
		"Only after it was working did I add basic analytics. It was initially just for curiosity, but it soon became a way to learn from real usage: which settings failed, which were popular, and what to refine next.",
		"That turned Cover Craft from a simple image generator into a quiet lesson in observable, privacy-first software.",
	];

	return (
		<section className="text-gray-600 flex flex-col gap-4">
			<SectionTitle size="lg">Why I Built This</SectionTitle>
			{paragraphs.map((text) => (
				<p key={text.slice(0, 20)} className="text-lg tracking-wide">
					{text}
				</p>
			))}
		</section>
	);
}
