import CoverForm from "@/components/form/CoverForm";
import MainLayout from "@/components/layout/MainLayout";
import { SectionTitle } from "@/components/ui";

export default function GeneratePage() {
	return (
		<MainLayout>
			<div className="max-w-5xl mx-auto">
				<div className="mb-8 text-center">
					<SectionTitle size="xl" as="h1">
						Generate Your Cover
					</SectionTitle>
					<p className="text-gray-600 mt-2">
						Customize your cover image with privacy-first tools.
					</p>
				</div>
				<CoverForm />
			</div>
		</MainLayout>
	);
}
