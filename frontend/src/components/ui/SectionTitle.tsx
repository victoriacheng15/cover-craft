import { cn } from "@/lib";

type SectionTitleProps = React.HTMLAttributes<HTMLHeadingElement> & {
  size?: "sm" | "md" | "lg" | "xl";
  as?: "h1" | "h2" | "h3";
};

export default function SectionTitle({
  className,
  size = "md",
  as = "h2",
  children,
  ...props
}: SectionTitleProps) {
  const sizeClasses = {
    sm: "text-sm font-semibold",
    md: "text-lg font-bold",
    lg: "text-xl font-bold",
    xl: "text-3xl font-bold",
  };

  const Tag = as;

  return (
    <Tag
      className={cn("mb-2 text-gray-900", sizeClasses[size], className)}
      {...props}
    >
      {children}
    </Tag>
  );
}
