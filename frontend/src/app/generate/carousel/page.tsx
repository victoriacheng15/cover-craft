import { CarouselForm } from "@/components/form";
import { GenerationNav } from "@/components/GenerationNav";
import { MainLayout } from "@/components/layouts";
import { SectionTitle } from "@/components/ui";

export default function CarouselPage() {
	return (
		<MainLayout>
			<article className="w-full">
				<header className="mb-8 text-center">
					<SectionTitle size="xl" as="h1">
						Carousel Builder
					</SectionTitle>
					<p className="text-gray-600 mt-2 text-lg">
						Design multi-slide PDF carousels and image decks with interactive
						canvas preview, custom formatting, and accessible typography.
					</p>

					<GenerationNav activeMode="carousel" className="mt-6" />
				</header>

				<section aria-label="Carousel generation form">
					<CarouselForm />
				</section>
			</article>
		</MainLayout>
	);
}
