import { Fragment } from "react";
import type { CandidateListResponse } from "@/types/candidate";

const PAGE_BUTTON =
  "inline-flex h-10 min-w-10 items-center justify-center whitespace-nowrap rounded-lg border px-3 text-slate-700 focus-visible:outline-2 focus-visible:outline-blue-500";

// Tablet and desktop only (mobile uses LoadMore).

type PaginationProps = Pick<
  CandidateListResponse,
  "total" | "page" | "limit"
> & {
  onPageChange: (page: number) => void; // Called when a page is selected
};
export default function Pagination({
  total,
  page,
  limit,
  onPageChange,
}: PaginationProps) {
  const lastPage = Math.max(1, Math.ceil(total / limit));
  const from = (page - 1) * limit + 1; // 11 on page 2
  const to = Math.min(page * limit, total); // 20, or less on the last page

  const pages = Array.from({ length: lastPage }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === lastPage || Math.abs(n - page) <= 1,
  );
  return (
    <nav
      aria-label="Candidate pages"
      className="flex items-center justify-between gap-4"
    >
      <p className="text-slate-500">
        Showing {from}–{to} of {total} candidates
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className={`${PAGE_BUTTON} border-slate-200 bg-white hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-white`}
        >
          Previous
        </button>
        {pages.map((n, i) => (
          <Fragment key={n}>
            {i > 0 && n - pages[i - 1] > 1 && (
              <span aria-hidden="true" className="px-1 text-slate-400">
                …
              </span>
            )}
            <button
              type="button"
              onClick={() => onPageChange(n)}
              aria-current={n === page ? "page" : undefined}
              className={`${PAGE_BUTTON} ${
                n === page
                  ? "border-blue-600 bg-blue-600 font-semibold text-white"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              {n}
            </button>
          </Fragment>
        ))}
        <button
          type="button"
          className={`${PAGE_BUTTON} border-slate-200 bg-white hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-white`}
          onClick={() => onPageChange(page + 1)}
          disabled={page === lastPage}
        >
          Next
        </button>
      </div>
    </nav>
  );
}
