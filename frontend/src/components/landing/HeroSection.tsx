import Link from "next/link";
import { Button, SectionTitle } from "@/components/ui";

export function HeroSection() {
	const ctaButtons = [
		{ href: "/generate", label: "Try the Generator", external: false },
		{ href: "/analytics", label: "See the Analytics", external: false },
		{ href: "/evolution", label: "See How It Evolved", external: false },
		{
			href: "https://github.com/victoriacheng15/cover-craft",
			label: "View Source Code",
			external: true,
		},
	];

	return (
		<section className="text-center flex flex-col items-center gap-10 py-10">
			<div className="flex flex-col items-center gap-4">
				<SectionTitle size="xl" as="h2">
					Generate Clean, Accessibility-First Covers. Zero Tracking. Zero
					Friction.
				</SectionTitle>
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
				{ctaButtons.map(({ href, label, external }) => (
					<Link
						key={href}
						href={href}
						target={external ? "_blank" : undefined}
						rel={external ? "noopener noreferrer" : undefined}
						className="w-full"
					>
						<Button
							variant="secondary"
							className="w-full px-6 py-6 text-lg font-semibold"
						>
							{label}
						</Button>
					</Link>
				))}
			</div>
		</section>
	);
}
