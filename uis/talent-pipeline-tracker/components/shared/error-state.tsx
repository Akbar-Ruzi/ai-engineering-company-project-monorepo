type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

// Failed request feedback with an optional Retry button.
// Reusable for the list, candidate details, and notes.
export default function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="mt-6 flex flex-col gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex gap-3">
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="mt-0.5 size-5 shrink-0 text-rose-600"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
            clipRule="evenodd"
          />
        </svg>
        <div>
          <p className="font-semibold text-rose-800">{title}</p>
          <p className="mt-1 text-sm text-rose-700">{message}</p>
        </div>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-rose-300 bg-white px-4 font-semibold text-rose-700 hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
        >
          Retry
        </button>
      )}
    </div>
  );
}
