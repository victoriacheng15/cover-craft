import { cn } from "@/lib";

interface SectionTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  size?: "sm" | "md" | "lg";
}

export default function SectionTitle({
  className,
  size = "md",
  children,
  ...props
}: SectionTitleProps) {
  const sizeClasses = {
    sm: "text-sm font-semibold",
    md: "text-lg font-bold",
    lg: "text-xl font-bold",
  };

  return (
    <h2
      className={cn(
        "mb-2 text-gray-900 dark:text-gray-50",
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </h2>
  );
}
