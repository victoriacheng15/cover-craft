import { cn } from "@/lib";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export default function Card({ className, children, ...props }: CardProps) {
	return (
		<div
			className={cn(
				"rounded-xl border border-emerald-500 bg-gray-50 p-4 shadow-sm",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}
