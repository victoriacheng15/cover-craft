import Link from "next/link";
import { Button, SectionTitle } from "@/components/ui";

export function HeroSection() {
	const ctaButtons = {
		Generate: { href: "/generate", label: "Try the Generator" },
		Analytics: { href: "/analytics", label: "See the Analytics" },
		Evolution: { href: "/evolution", label: "See How It Evolved" },
	};

	return (
		<section className="text-center flex flex-col items-center gap-10 py-10">
			<div className="flex flex-col items-center gap-4">
				<SectionTitle size="xl" as="h2">
					Generate Clean, Accessibility-First Covers. Zero Tracking. Zero
					Friction.
				</SectionTitle>
			</div>
			<div className="flex gap-4 flex-wrap justify-center">
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
	);
}
