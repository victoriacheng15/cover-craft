import { Card } from "@/components/ui";
import type { TimelineEvent } from "../content";

interface TimelineItemProps {
	event: TimelineEvent;
}

export default function TimelineItem({ event }: TimelineItemProps) {
	return (
		<li className="relative pl-8 md:pl-12">
			<div className="absolute -left-[9px] top-6 h-4 w-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm ring-1 ring-emerald-100" />
			<Card className="flex flex-col gap-3 hover:shadow-md transition-shadow">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
					<h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
					<time
						dateTime={event.date}
						className="font-mono text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded w-fit"
					>
						{event.date}
					</time>
				</div>
				<p className="text-gray-600 leading-relaxed text-sm">
					{event.description}
				</p>
				{event.lessonLearned && (
					<div className="mt-3 p-4 bg-emerald-50 rounded-lg border-l-4 border-emerald-400">
						<h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
							Lesson Learned
						</h4>
						<p className="text-sm text-emerald-700 italic">
							{event.lessonLearned}
						</p>
					</div>
				)}
			</Card>
		</li>
	);
}
