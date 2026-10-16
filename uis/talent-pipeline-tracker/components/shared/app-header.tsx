import Link from "next/link";

export default function AppHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:h-20 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600">
            {/* Pipeline icon */}
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5"
            >
              <circle cx="6" cy="6" r="2.5" />
              <circle cx="6" cy="18" r="2.5" />
              <circle cx="18" cy="12" r="2.5" />
              <path d="M8.5 6h2a4 4 0 0 1 4 4v0.5M8.5 18h2a4 4 0 0 0 4-4v-0.5" />
            </svg>
          </span>
          <span className="text-lg font-semibold text-slate-900 sm:text-xl">
            Talent Pipeline Tracker
          </span>
        </Link>
      </div>
    </header>
  );
}
