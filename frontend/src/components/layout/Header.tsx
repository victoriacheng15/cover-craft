export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-emerald-200 text-gray-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo / Title */}
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold">Cover Craft 🎨</h1>
          </div>
        </div>
      </div>
    </header>
  );
}
