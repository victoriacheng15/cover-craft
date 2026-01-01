import Link from "next/link";

export default function Nav() {
	const nav = {
		home: { href: "/", label: "Home" },
		generate: { href: "/generate", label: "Generate" },
		evolution: { href: "/evolution", label: "Evolution" },
		analytics: { href: "/analytics", label: "Analytics" },
	};

	return (
		<nav className="flex-0">
			<ul className="flex items-center gap-1 md:gap-2 text-sm md:text-base">
				{Object.values(nav).map(({ href, label }) => (
					<li key={href}>
						<Link
							href={href}
							className="px-3 py-2 rounded-md text-gray-900 font-bold hover:bg-emerald-300 transition-colors"
						>
							{label}
						</Link>
					</li>
				))}
			</ul>
		</nav>
	);
}
