import { cn } from "@/lib/utils";

interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  description?: string;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
}

export default function FormField({
  className,
  label,
  description,
  error,
  htmlFor,
  children,
  ...props
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1", className)} {...props}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-gray-900 dark:text-gray-50"
      >
        {label}
      </label>
      {children}
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
