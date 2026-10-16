const ROWS = [1, 2, 3, 4, 5];

const BAR = "rounded-full bg-slate-200";

// Placeholder shown while candidates load. Same shapes as the real list,
// so the layout does not jump when the data arrives.
export default function CandidateListSkeleton() {
  return (
    <div aria-busy="true" className="animate-pulse">
      <span className="sr-only" role="status">
        Loading candidates…
      </span>

      {/* Mobile: card placeholders */}
      <ul aria-hidden="true" className="mt-4 space-y-4 md:hidden">
        {ROWS.map((row) => (
          <li key={row} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`h-5 w-40 ${BAR}`} />
            <div className={`mt-2 h-4 w-28 ${BAR}`} />
            <div className="mt-6 flex items-center justify-between">
              <div className={`h-4 w-14 ${BAR}`} />
              <div className={`h-6 w-24 ${BAR}`} />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className={`h-4 w-24 ${BAR}`} />
              <div className={`h-6 w-32 ${BAR}`} />
            </div>
          </li>
        ))}
      </ul>

      {/* Tablet and desktop: table-row placeholders */}
      <div
        aria-hidden="true"
        className="mt-6 hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block"
      >
        <div className="grid grid-cols-4 gap-6 border-b border-slate-200 px-6 py-5 lg:px-8">
          {[1, 2, 3, 4].map((col) => (
            <div key={col} className={`h-3 w-20 ${BAR}`} />
          ))}
        </div>
        <div className="divide-y divide-slate-100">
          {ROWS.map((row) => (
            <div key={row} className="grid grid-cols-4 items-center gap-6 px-6 py-5 lg:px-8">
              <div className={`h-4 w-32 ${BAR}`} />
              <div className={`h-4 w-36 ${BAR}`} />
              <div className={`h-6 w-24 ${BAR}`} />
              <div className={`h-6 w-32 ${BAR}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
