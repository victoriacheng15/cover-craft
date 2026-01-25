import MainLayout from "@/components/layout/MainLayout";
import { SectionTitle } from "@/components/ui";
import ChapterSummary from "./_components/ChapterSummary";
import TimelineItem from "./_components/TimelineItem";
import { chapters } from "./content";

export default function EvolutionPage() {
	return (
		<MainLayout>
			<div className="max-w-3xl mx-auto space-y-8">
				<div className="text-center mb-12">
					<SectionTitle size="xl" as="h1">
						The Evolution of Cover Craft
					</SectionTitle>
				</div>

				{[...chapters].reverse().map((chapter, index) => (
					<details
						key={chapter.title}
						className="group bg-white border border-gray-200 rounded-xl shadow-sm open:ring-2 open:ring-emerald-100 transition-all duration-200"
						open={index === 0}
					>
						<ChapterSummary chapter={chapter} />

						<div className="px-6 pb-8 pt-2">
							<ul className="relative border-l-2 border-emerald-200 ml-2 md:ml-4 space-y-8">
								{[...chapter.timeline].reverse().map((event) => (
									<TimelineItem key={event.title} event={event} />
								))}
							</ul>
						</div>
					</details>
				))}
			</div>
		</MainLayout>
	);
}
