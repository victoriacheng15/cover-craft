import { CarouselForm } from "@/components/form";
import { GenerationPageLayout } from "@/components/layouts";

export default function CarouselPage() {
	return (
		<GenerationPageLayout
			title="Carousel Builder"
			description="Design multi-slide PDF carousels and image decks with interactive canvas preview, custom formatting, and accessible typography."
			activeMode="carousel"
			ariaLabel="Carousel generation form"
		>
			<CarouselForm />
		</GenerationPageLayout>
	);
}
