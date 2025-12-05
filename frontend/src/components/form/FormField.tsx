import { cn } from "@/lib/utils";

interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
	label: string;
	error?: string;
	htmlFor?: string;
	required?: boolean;
	children: React.ReactNode;
}

export default function FormField({
	className,
	label,
	error,
	htmlFor,
	required = false,
	children,
	...props
}: FormFieldProps) {
	return (
		<div className={cn("flex flex-col gap-1", className)} {...props}>
			<label
				htmlFor={htmlFor}
				className="block text-sm font-medium text-gray-900"
			>
				{label}
				{required && <span className="text-red-500 ml-1">*</span>}
			</label>
			{children}
			{error && (
				<p className="text-xs text-red-500" role="alert">
					{error}
				</p>
			)}
		</div>
	);
}
