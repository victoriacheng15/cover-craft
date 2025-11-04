import { cn } from "@/lib";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
}

export default function Button({
  variant = "primary",
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-emerald-500 hover:bg-emerald-600 text-gray-50 dark:text-gray-900 dark:bg-emerald-400 dark:hover:bg-emerald-500",
    secondary:
      "bg-gray-600 hover:bg-gray-700 text-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600",
    outline:
      "border border-emerald-500 text-emerald-500 hover:bg-emerald-50 dark:border-emerald-400 dark:text-emerald-400 dark:hover:bg-gray-800",
  };

  const base =
    "inline-flex items-center justify-center px-4 py-2 rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

  return (
    <button
      className={cn(base, variants[variant], className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
