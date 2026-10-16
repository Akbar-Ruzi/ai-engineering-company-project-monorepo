import { STAGE_LABELS, STATUS_LABELS } from "@/lib/constants";

const SELECT_CLASSES =
  "h-12 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-4 pr-10 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

function Chevron() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-slate-500"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// Search box, Status and Stage filters, and Clear filters.
// Options show UI labels; option values are the raw API values.
export default function CandidateFilters() {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 md:flex-row md:gap-5">
        <label className="relative block md:flex-1">
          <span className="sr-only">Search by name or email</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400"
          >
            <circle cx="9" cy="9" r="6" />
            <path d="m13.5 13.5 3.5 3.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            placeholder="Search by name or email..."
            className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-12 pr-4 text-slate-900 shadow-sm placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </label>

        <div className="grid grid-cols-2 gap-3 md:flex md:gap-5">
          <label className="relative block md:w-56">
            <span className="sr-only">Filter by status</span>
            <select defaultValue="" className={SELECT_CLASSES}>
              <option value="">All statuses</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <Chevron />
          </label>

          <label className="relative block md:w-56">
            <span className="sr-only">Filter by stage</span>
            <select defaultValue="" className={SELECT_CLASSES}>
              <option value="">All stages</option>
              {Object.entries(STAGE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <Chevron />
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          className="inline-flex items-center gap-2 whitespace-nowrap rounded-md px-2 py-1 text-sm text-slate-500 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-500 md:text-base"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            className="size-4"
          >
            <path d="m5 5 10 10M15 5 5 15" />
          </svg>
          Clear filters
        </button>
      </div>
    </div>
  );
}
