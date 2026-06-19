import { cn } from "@/lib";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, type = "text", ...props }: InputProps) {
	return (
		<input
			type={type}
			className={cn(
				"flex h-10 w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm",
				"placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
				"disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			{...props}
		/>
	);
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export function Select({ className, children, ...props }: SelectProps) {
	return (
		<select
			className={cn(
				"flex h-10 w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
				"disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			{...props}
		>
			{children}
		</select>
	);
}

interface FormErrorProps {
	error?: string | null;
	errorId?: string;
}

export function FormError({ error, errorId }: FormErrorProps) {
	if (!error) return null;

	return (
		<div
			className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl"
			role="alert"
			id={errorId}
			aria-live="polite"
		>
			<p className="text-sm font-medium">{error}</p>
		</div>
	);
}

interface ColorPickerProps
	extends React.InputHTMLAttributes<HTMLInputElement> {}

export function ColorPicker({ className, title, ...props }: ColorPickerProps) {
	return (
		<input
			type="color"
			className={cn(
				"h-10 w-full rounded-md border border-input p-0 cursor-pointer",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
				className,
			)}
			title={title || "Select a color"}
			{...props}
		/>
	);
}
