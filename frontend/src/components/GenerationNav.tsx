import Link from "next/link";

export interface GenerationNavProps {
	activeMode: "single" | "carousel" | "gif";
	className?: string;
}

export function GenerationNav({
	activeMode,
	className = "",
}: GenerationNavProps) {
	const modes = [
		{ id: "single", label: "Single Cover", href: "/generate" },
		{ id: "carousel", label: "Carousel Builder", href: "/generate/carousel" },
		{ id: "gif", label: "GIF Slideshow", href: "/generate/slideshow" },
	] as const;

	return (
		<nav
			className={`flex justify-center ${className}`}
			aria-label="Generation modes"
		>
			<div className="inline-flex p-1 bg-gray-100 rounded-xl border border-gray-200 gap-1 shadow-xs">
				{modes.map(({ id, label, href }) => {
					const isActive = activeMode === id;
					return (
						<Link
							key={id}
							href={href}
							className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
								isActive
									? "bg-white text-emerald-700 shadow-sm font-bold"
									: "text-gray-600 hover:text-gray-900 hover:bg-gray-200/60"
							}`}
							aria-current={isActive ? "page" : undefined}
						>
							{label}
						</Link>
					);
				})}
			</div>
		</nav>
	);
}
