import Link from "next/link";
import { Nav, SectionTitle } from "@/components/ui";

export default function Header() {
	return (
		<header className="sticky top-0 z-50 bg-emerald-200 text-gray-900 shadow-sm">
			<div className="w-[90%] max-w-7xl mx-auto py-4 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
				<Link href="/" className="hover:opacity-80 transition-opacity">
					<SectionTitle as="h1" size="xl" className="mb-0">
						Cover Craft 🎨
					</SectionTitle>
				</Link>
				<Nav />
			</div>
		</header>
	);
}
