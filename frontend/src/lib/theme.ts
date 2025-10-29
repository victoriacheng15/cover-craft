export const variants = {
  primary:
    "bg-emerald-500 hover:bg-emerald-600 text-gray-50 dark:text-gray-900 dark:bg-emerald-400 dark:hover:bg-emerald-500",
  secondary:
    "bg-gray-600 hover:bg-gray-700 text-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600",
  outline:
    "border border-emerald-500 text-emerald-500 hover:bg-emerald-50 dark:border-emerald-400 dark:text-emerald-400 dark:hover:bg-gray-800",
} as const;

export const colors = {
  background: {
    light: "bg-gray-50",
    dark: "dark:bg-gray-900",
  },
  text: {
    light: "text-gray-900",
    dark: "dark:text-gray-50",
  },
  accent: {
    base: "text-emerald-500",
    hover: "hover:text-emerald-600",
  },
};
