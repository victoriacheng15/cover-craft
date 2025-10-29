import { cn } from "@/lib";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export default function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-sm",
        "dark:bg-gray-800 dark:border-gray-700",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
