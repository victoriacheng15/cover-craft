import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-emerald-200 text-gray-900 py-4 mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center items-center space-x-2">
        <span>© 2025 Victoria Cheng</span>
        <span>|</span>
        <Link
          href="https://github.com/your-repo"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-emerald-500"
        >
          GitHub
        </Link>
      </div>
    </footer>
  );
}
