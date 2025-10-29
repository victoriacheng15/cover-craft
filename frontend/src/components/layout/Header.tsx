import Link from "next/link";
import { ThemeToggle } from "@/components/ui";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-gray-700 dark:bg-gray-900 text-gray-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo / Title */}
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold">Cover Craft 🎨</span>
          </div>

          {/* Right side: Dark mode toggle + GitHub link */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Link
              href="https://github.com/your-repo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-50 hover:text-emerald-500"
            >
              GitHub
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
