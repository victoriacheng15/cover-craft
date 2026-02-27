import Link from "next/link";
import { CoverForm } from "@/components/form";
import MainLayout from "@/components/layout/MainLayout";
import { Button, SectionTitle } from "@/components/ui";

export default function GeneratePage() {
	return (
		<MainLayout>
			<article className="max-w-5xl mx-auto px-4">
				<header className="mb-8 text-center">
					<SectionTitle size="xl" as="h1">
						Generate Your Cover
					</SectionTitle>
					<p className="text-gray-600 mt-2 text-lg">
						Customize your cover image with privacy-first tools.
					</p>

					<nav
						className="mt-6 flex justify-center gap-4"
						aria-label="Generation modes"
					>
						<Link href="/generate/batch">
							<Button
								variant="outline"
								className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold"
							>
								Switch to Bulk Generation
							</Button>
						</Link>
					</nav>
				</header>

				<section aria-label="Single image generation form">
					<CoverForm />
				</section>
			</article>
		</MainLayout>
	);
}
