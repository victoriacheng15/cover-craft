import { cn } from "@/lib";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export default function Card({ className, children, ...props }: CardProps) {
	return (
		<div
			className={cn(
				"rounded-xl border border-emerald-200 bg-gray-50 p-4 shadow-sm transition-all duration-200 hover:border-emerald-500 hover:shadow-md",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}
