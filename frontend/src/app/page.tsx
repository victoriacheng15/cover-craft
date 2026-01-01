"use client";

import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import { Button, Card, SectionTitle } from "@/components/ui";

export default function LandingPage() {
	const ctaButtons = {
		Generate: { href: "/generate", label: "Try the Generator" },
		Analytics: { href: "/analytics", label: "See the Analytics" },
		Evolution: { href: "/evolution", label: "See How It Evolved" },
	};

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
		<MainLayout>
			<div className="flex flex-col gap-16 max-w-3xl mx-auto">
				{/* Hero Section */}
				<section className="text-center flex flex-col items-center gap-10 py-10">
					<div className="flex flex-col items-center gap-4">
						<SectionTitle size="xl" as="h2">
							Generate Clean, Accessibility-First Covers. Zero Tracking. Zero
							Friction.
						</SectionTitle>
					</div>
					<div className="flex gap-4 flex-wrap justify-center">
						{" "}
						{Object.values(ctaButtons).map(({ href, label }) => (
							<Link key={href} href={href}>
								<Button
									variant="secondary"
									className="px-6 py-4 text-lg font-semibold"
								>
									{label}
								</Button>
							</Link>
						))}
					</div>
				</section>

				{/* Visual / Demo Placeholder */}
				{/* <section className="w-full aspect-[2/1] bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden shadow-sm">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-emerald-100 opacity-50" />
					<p className="text-gray-400 font-medium relative z-10">
						[ Visual: Screenshot or GIF of the generator in action ]
					</p>
				</section> */}

				{/* Origin Story */}
				<section className="text-gray-600 flex flex-col gap-4">
					<SectionTitle size="lg">Why I Built This</SectionTitle>
					<p className="text-lg tracking-wide">
						I used to generate LinkedIn cover images with a local Python script.
						It was simple, but I had to wrestle with virtual environments every
						time I needed a new one. I just wanted a reliable, no-setup way to
						make clean, readable covers.
					</p>
					<p className="text-lg tracking-wide">
						So I rebuilt it as a lightweight web app using Azure Functions and
						Next.js. With no login and no dependencies, you can just generate
						and download.
					</p>
					<p className="text-lg tracking-wide">
						Only after it was working did I add basic analytics. It was
						initially just for curiosity, but it soon became a way to learn from
						real usage: which settings failed, which were popular, and what to
						refine next.
					</p>
					<p className="text-lg tracking-wide">
						That turned Cover Craft from a simple image generator into a quiet
						lesson in observable, privacy-first software.
					</p>
				</section>

				{/* Design Principles */}
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

				{/* Footer Link */}
				<div className="text-center py-8">
					<Link
						href="https://github.com/victoriacheng15/cover-craft"
						target="_blank"
						className="text-emerald-600 hover:text-emerald-700 font-semibold underline decoration-2 underline-offset-2"
					>
						View Source Code on GitHub →
					</Link>
				</div>
			</div>
		</MainLayout>
	);
}
