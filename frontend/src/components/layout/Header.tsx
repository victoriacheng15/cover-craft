import Link from "next/link";
import { SectionTitle } from "@/components/ui";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-emerald-200 text-gray-900 shadow-sm">
      <div className="w-[90%] max-w-7xl mx-auto py-4 flex items-center justify-between">
        <SectionTitle as="h1" size="xl">
          Cover Craft 🎨
        </SectionTitle>
        <nav className="flex-0">
          <ul className="flex items-center gap-2">
            <li>
              <Link
                href="/"
                className="px-4 py-2 rounded hover:bg-emerald-400 text-gray-900 font-semibold transition-colors"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/analytics"
                className="px-4 py-2 rounded hover:bg-emerald-400 text-gray-900 font-semibold transition-colors"
              >
                Analytics
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
