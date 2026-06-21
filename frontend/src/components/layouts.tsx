import Link from "next/link";
import type { ReactNode } from "react";
import { SectionTitle } from "@/components/ui";
import { landingConfig } from "@/lib/landingConfig";

export function Nav() {
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

export function Header() {
	return (
		<header className="sticky top-0 z-50 bg-emerald-200 text-gray-900 shadow-sm">
			<div className="w-[90%] max-w-7xl mx-auto py-4 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
				<Link href="/" className="hover:opacity-80 transition-opacity">
					<SectionTitle as="h1" size="xl" className="mb-0">
						{landingConfig.header.project_name} 🎨
					</SectionTitle>
				</Link>
				<Nav />
			</div>
		</header>
	);
}

interface MainLayoutProps {
	children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
	return (
		<div className="flex flex-col min-h-screen bg-emerald-100 text-gray-900">
			{/* Header */}
			<Header />

			{/* Main content */}
			<main className="flex-1 w-[90%] max-w-7xl mx-auto py-8">{children}</main>

			{/* Footer */}
			<Footer />
		</div>
	);
}

export function Footer() {
	return (
		<footer className="bg-emerald-200 text-gray-900 py-4 mt-auto border-t border-emerald-300">
			<div className="w-[90%] max-w-7xl mx-auto flex flex-row justify-center items-center gap-6">
				<p className="text-sm font-bold tracking-tight text-center">
					© {new Date().getFullYear()} Victoria Cheng
				</p>

				<nav aria-label="Social links" className="flex items-center gap-4">
					<a
						href="https://github.com/victoriacheng15"
						target="_blank"
						rel="noopener noreferrer"
						className="hover:text-emerald-700 transition-colors"
						aria-label="GitHub Repository"
					>
						<span className="sr-only">GitHub Repository</span>
						<svg
							viewBox="0 0 24 24"
							className="w-6 h-6 fill-current"
							aria-hidden="true"
						>
							<path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
						</svg>
					</a>
					<a
						href="https://www.linkedin.com/in/victoriacheng15"
						target="_blank"
						rel="noopener noreferrer"
						className="hover:text-emerald-700 transition-colors"
						aria-label="LinkedIn Profile"
					>
						<span className="sr-only">LinkedIn Profile</span>
						<svg
							viewBox="0 0 24 24"
							className="w-6 h-6 fill-current"
							aria-hidden="true"
						>
							<path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
						</svg>
					</a>
				</nav>
			</div>
		</footer>
	);
}
