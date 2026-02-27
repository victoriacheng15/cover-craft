import type { ContrastCheckResult } from "@/hooks";

interface ColorContrastMessageProps {
	contrastCheck: ContrastCheckResult;
}

export default function ColorContrastMessage({
	contrastCheck,
}: ColorContrastMessageProps) {
	function getContrastColorClasses(status: "good" | "warning" | "poor") {
		const colorMap: Record<
			"good" | "warning" | "poor",
			{ dot: string; text: string }
		> = {
			good: { dot: "bg-emerald-500", text: "text-emerald-700" },
			warning: { dot: "bg-yellow-500", text: "text-yellow-700" },
			poor: { dot: "bg-red-500", text: "text-red-700" },
		};
		return colorMap[status];
	}

	return (
		<div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
			<div className="flex items-center justify-between">
				<p className="text-sm font-medium text-emerald-900">Color Contrast</p>
				<output
					className="flex items-center gap-2"
					aria-live="polite"
					aria-atomic="true"
				>
					{contrastCheck.status && (
						<>
							<span
								className={`inline-block w-3 h-3 rounded-full ${getContrastColorClasses(contrastCheck.status).dot}`}
								aria-hidden="true"
							></span>
							<p
								className={`text-sm font-semibold ${getContrastColorClasses(contrastCheck.status).text}`}
							>
								{contrastCheck.message}
							</p>
							<span className="sr-only">
								Contrast status is {contrastCheck.status}
							</span>
						</>
					)}
				</output>
			</div>
		</div>
	);
}
