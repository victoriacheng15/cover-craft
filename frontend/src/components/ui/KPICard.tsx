interface KPICardProps {
	title: string;
	value: number | string;
	color:
		| "blue"
		| "green"
		| "purple"
		| "orange"
		| "indigo"
		| "pink"
		| "red"
		| "white";
	suffix?: string;
	bold?: boolean;
}

const colorStyles: Record<string, { bg: string; text: string }> = {
	blue: { bg: "bg-blue-50", text: "text-blue-600" },
	green: { bg: "bg-green-50", text: "text-green-600" },
	purple: { bg: "bg-purple-50", text: "text-purple-600" },
	orange: { bg: "bg-orange-50", text: "text-orange-600" },
	indigo: { bg: "bg-indigo-50", text: "text-indigo-600" },
	pink: { bg: "bg-pink-50", text: "text-pink-600" },
	red: { bg: "bg-red-50", text: "text-red-600" },
	white: { bg: "bg-white border border-gray-200", text: "text-gray-900" },
};

export default function KPICard({
	title,
	value,
	color,
	suffix,
	bold = true,
}: KPICardProps) {
	const { bg, text } = colorStyles[color];
	const formattedValue = typeof value === "number" ? value.toFixed(0) : value;

	return (
		<div className={`${bg} rounded-xl p-4`}>
			<p className="text-sm text-gray-600">{title}</p>
			<p className={`text-2xl ${bold ? "font-bold" : "font-semibold"} ${text}`}>
				{formattedValue}
				{suffix}
			</p>
		</div>
	);
}
