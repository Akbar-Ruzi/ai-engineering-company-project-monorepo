type LoadMoreProps = {
  loaded: number; // candidates already shown
  total: number; // all matching candidates
  loading: boolean; // next page is being fetched
  error?: string | null; // last automatic load failed
  onRetry: () => void; // load the next page again after a failure
};

// Mobile only: status shown below the cards while scrolling loads more.
// There is no Load more button (matches the mockup). The page watches this
// area with IntersectionObserver and loads the next page when it scrolls into view.
export default function LoadMore({ loaded, total, loading, error, onRetry }: LoadMoreProps) {
  if (loaded >= total) {
    return (
      <p className="py-2 text-center text-sm text-slate-500">
        All {total} candidates loaded
      </p>
    );
  }

  if (error) {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 py-2">
        <p className="text-center text-sm text-rose-700">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-4 font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          Try again
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <p role="status" className="flex items-center justify-center gap-2 py-2 text-sm text-slate-500">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          className="size-5 animate-spin text-slate-400"
        >
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
        Loading more candidates…
      </p>
    );
  }

  // Idle: invisible spacer that gives the observer something to watch.
  return <div aria-hidden="true" className="h-10" />;
}
