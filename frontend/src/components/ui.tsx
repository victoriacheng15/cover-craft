import { cn } from "@/lib/utils";

// ===================================================================================
// Button Component
// ===================================================================================

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "primary" | "secondary" | "outline";
	isLoading?: boolean;
}

export function Button({
	variant = "primary",
	className,
	disabled,
	isLoading = false,
	children,
	...props
}: ButtonProps) {
	return (
		<button
			type="button"
			className={cn(
				"inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
				"disabled:pointer-events-none disabled:opacity-50 h-10 px-5 py-2 group-invalid:pointer-events-none group-invalid:opacity-50",
				variant === "primary" &&
					"bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white shadow-sm hover:shadow-md",
				variant === "secondary" &&
					"bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800",
				variant === "outline" &&
					"border border-emerald-500 text-emerald-500 hover:bg-emerald-50 active:bg-emerald-100",
				className,
			)}
			disabled={disabled || isLoading}
			{...props}
		>
			{isLoading ? (
				<span className="inline-block animate-spin mr-2">⏳</span>
			) : null}
			{children}
		</button>
	);
}

// ===================================================================================
// Card Components (Card, KPICard)
// ===================================================================================

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, children, ...props }: CardProps) {
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

export function KPICard({
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

// ===================================================================================
// Form Controls Components (Input, Select, FormError, ColorPicker)
// ===================================================================================

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

// ===================================================================================
// SectionTitle Component
// ===================================================================================

type SectionTitleProps = React.HTMLAttributes<HTMLHeadingElement> & {
	size?: "sm" | "md" | "lg" | "xl";
	as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
};

export function SectionTitle({
	className,
	size = "md",
	as = "h2",
	children,
	...props
}: SectionTitleProps) {
	const sizeClasses = {
		sm: "text-lg font-bold text-gray-900 tracking-tight",
		md: "text-2xl font-bold text-gray-900 tracking-tight",
		lg: "text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl",
		xl: "text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl",
	};

	const Component = as;

	return (
		<Component className={cn(sizeClasses[size], className)} {...props}>
			{children}
		</Component>
	);
}

// ===================================================================================
// Skeleton Component
// ===================================================================================

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
	return (
		<div
			className={cn("animate-pulse rounded-md bg-gray-200", className)}
			{...props}
		/>
	);
}
