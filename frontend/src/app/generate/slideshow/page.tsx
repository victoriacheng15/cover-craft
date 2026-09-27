import { GifForm } from "@/components/form";
import { GenerationPageLayout } from "@/components/layouts";

export default function SlideshowPage() {
	return (
		<GenerationPageLayout
			title="Animated GIF Slideshow"
			description="Design multi-frame animated cover slideshows with customizable delay and accessible colors."
			activeMode="gif"
			ariaLabel="Animated GIF slideshow generation form"
		>
			<GifForm />
		</GenerationPageLayout>
	);
}
