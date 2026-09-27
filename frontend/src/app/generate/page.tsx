import { CoverForm } from "@/components/form";
import { GenerationPageLayout } from "@/components/layouts";

export default function GeneratePage() {
	return (
		<GenerationPageLayout
			title="Generate Your Cover"
			description="Customize your cover image with privacy-first tools."
			activeMode="single"
			ariaLabel="Single image generation form"
		>
			<CoverForm />
		</GenerationPageLayout>
	);
}
