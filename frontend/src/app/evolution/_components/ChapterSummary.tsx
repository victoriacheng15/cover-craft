import type { Chapter } from "../content";

interface ChapterSummaryProps {
	chapter: Chapter;
}

export default function ChapterSummary({ chapter }: ChapterSummaryProps) {
	return (
		<summary className="cursor-pointer list-none p-6 flex flex-col gap-3 select-none hover:bg-gray-50/50 rounded-xl transition-colors">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
				<h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
					<span className="transform transition-transform duration-200 group-open:rotate-90 text-emerald-500">
						▶
					</span>
					{chapter.title}
				</h2>
				<span className="text-sm font-bold tracking-wide text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
					{chapter.period}
				</span>
			</div>
			<p className="text-gray-600 leading-relaxed pl-6 border-l-2 border-gray-100 ml-2">
				{chapter.intro}
			</p>
		</summary>
	);
}
