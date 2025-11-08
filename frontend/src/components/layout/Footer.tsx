import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-emerald-200 text-gray-900 py-4">
      <div className="w-[90%] max-w-7xl mx-auto flex justify-center items-center space-x-2">
        <span>© 2025 Victoria Cheng</span>
        <span>|</span>
        <Link
          href="https://github.com/victoriacheng15/cover-craft"
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
