import Link from "next/link";
import { SectionTitle } from "@/components/ui";

export function HeroSection() {
	const actions = [
		{ href: "/generate", label: "Start generating", external: false },
		{
			href: "https://github.com/victoriacheng15/cover-craft",
			label: "View source",
			external: true,
		},
		{ href: "/generate/batch", label: "Bulk generation", external: false },
		{ href: "/analytics", label: "Analytics", external: false },
		{ href: "/evolution", label: "Evolution", external: false },
	];
	const actionClass =
		"flex min-h-14 w-full items-center justify-center rounded-lg border border-emerald-600 bg-white/75 px-5 py-3 text-base font-bold text-gray-900 shadow-sm transition-colors hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2";

	return (
		<section className="flex flex-col items-center gap-8 py-10 text-center">
			<div className="flex flex-col items-center gap-5 max-w-3xl">
				<SectionTitle size="xl" as="h2" className="text-4xl md:text-5xl">
					Generate clean, readable cover images without design-tool setup.
				</SectionTitle>
				<p className="text-lg md:text-xl text-gray-700 leading-relaxed">
					Cover Craft creates PNG covers from simple text, color, and layout
					controls. It includes accessibility checks, fast single-image
					generation, and queued batch processing for repeat work.
				</p>
			</div>

			<nav aria-label="Landing page actions" className="w-full max-w-2xl">
				<ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					{actions.map(({ href, label, external }, index) => (
						<li
							key={href}
							className={index === actions.length - 1 ? "sm:col-span-2" : ""}
						>
							<Link
								href={href}
								target={external ? "_blank" : undefined}
								rel={external ? "noopener noreferrer" : undefined}
								className={actionClass}
							>
								{label}
							</Link>
						</li>
					))}
				</ul>
			</nav>
		</section>
	);
}
