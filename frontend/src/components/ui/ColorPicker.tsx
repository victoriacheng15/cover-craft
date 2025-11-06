import { cn } from "@/lib";

interface ColorPickerProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export default function ColorPicker({ className, title, ...props }: ColorPickerProps) {
  return (
    <input
      type="color"
      className={cn(
        "h-10 w-16 rounded-md border border-input p-0 cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      title={title || "Select a color"}
      {...props}
    />
  );
}
