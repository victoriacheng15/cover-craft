import Link from "next/link";

export function SourceCodeLink() {
	return (
		<div className="text-center py-8">
			<Link
				href="https://github.com/victoriacheng15/cover-craft"
				target="_blank"
				className="text-emerald-600 hover:text-emerald-700 font-semibold underline decoration-2 underline-offset-2"
			>
				View Source Code on GitHub →
			</Link>
		</div>
	);
}
