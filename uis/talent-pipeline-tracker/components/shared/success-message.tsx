// Successful save feedback: a green banner with a check icon.
// Reusable for status/stage saves, the edit form, and notes.
// role="status" makes screen readers announce it without moving focus.
export default function SuccessMessage({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="size-5 shrink-0 text-emerald-600"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
          clipRule="evenodd"
        />
      </svg>
      <p className="text-sm font-medium text-emerald-800">{message}</p>
    </div>
  );
}
