import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-emerald-200 text-gray-900 shadow-sm">
      <div className="w-[90%] max-w-7xl mx-auto py-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold flex-1">Cover Craft 🎨</h1>
        <nav className="flex-0">
          <Link
            href="/analytics"
            className="ml-4 px-4 py-2 rounded hover:bg-emerald-400 text-gray-900 font-semibold transition-colors"
          >
            Analytics
          </Link>
        </nav>
      </div>
    </header>
  );
}
