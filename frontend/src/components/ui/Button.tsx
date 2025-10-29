import { cn, variants } from "@/lib";


interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
}

export default function Button({
  variant = "primary",
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
    const base =
    "inline-flex items-center justify-center px-4 py-2 rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <button className={cn(base, variants[variant], className)} disabled={disabled} {...props}>
      {children}
    </button>
  )
}