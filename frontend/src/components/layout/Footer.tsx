import Link from "next/link";
import { Nav } from "@/components/ui";

export default function Footer() {
	return (
		<footer className="bg-emerald-200 text-gray-900 py-4 mt-auto">
			<div className="w-[90%] max-w-7xl mx-auto flex flex-col-reverse md:flex-row justify-between items-center gap-4">
				<div className="flex items-center gap-2 text-sm font-medium">
					<span>© 2025 Victoria Cheng</span>
					<span>|</span>
					<Link
						href="https://github.com/victoriacheng15/cover-craft"
						target="_blank"
						rel="noopener noreferrer"
						className="hover:text-emerald-500"
					>
						View Code on GitHub
					</Link>
				</div>

				<Nav />
			</div>
		</footer>
	);
}
