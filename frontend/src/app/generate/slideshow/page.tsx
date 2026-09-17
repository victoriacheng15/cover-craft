import { GifForm } from "@/components/form";
import { GenerationNav } from "@/components/GenerationNav";
import { MainLayout } from "@/components/layouts";
import { SectionTitle } from "@/components/ui";

export default function SlideshowPage() {
	return (
		<MainLayout>
			<article className="w-full">
				<header className="mb-8 text-center">
					<SectionTitle size="xl" as="h1">
						Animated GIF Slideshow
					</SectionTitle>
					<p className="text-gray-600 mt-2 text-lg">
						Design multi-frame animated cover slideshows with customizable delay
						and accessible colors.
					</p>

					<GenerationNav activeMode="gif" className="mt-6" />
				</header>

				<section aria-label="Animated GIF slideshow generation form">
					<GifForm />
				</section>
			</article>
		</MainLayout>
	);
}
