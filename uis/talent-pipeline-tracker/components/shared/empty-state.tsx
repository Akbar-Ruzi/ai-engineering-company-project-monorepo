type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

// Shown when a request succeeds but returns nothing.
// Examples: "No candidates yet", "No matching candidates" + Clear filters, "No notes yet".
export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-6"
        >
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 19.5a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M21.5 19.5a6.5 6.5 0 0 0-4-6" />
        </svg>
      </span>
      <p className="mt-4 text-lg font-semibold text-slate-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-slate-500">{description}</p>}

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex h-10 items-center justify-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-4 font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
