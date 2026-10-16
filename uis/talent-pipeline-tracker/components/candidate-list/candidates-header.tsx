// Page title, active search, and the Add candidate action.
export default function CandidatesHeader() {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Candidates</h1>
        <p className="mt-1 text-slate-500">Executive Assistant · Austin HQ</p>
      </div>
      <button
        type="button"
        className="inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-4 font-semibold text-white shadow-md hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 sm:h-12 sm:px-5"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="size-5"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add candidate
      </button>
    </div>
  );
}
