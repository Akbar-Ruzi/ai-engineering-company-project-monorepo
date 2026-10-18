import type { ReactNode } from "react";

// White card with an uppercase title and an optional action (e.g. Edit).
// Shared by the Recruitment progress and General information cards.
export function DetailCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

// The pencil "Edit" button in a card's title row.
// label gives screen readers the full name, e.g. "Edit recruitment progress".
export function EditButton({
  label,
  onClick,
}: {
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-500"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-4"
      >
        <path d="M13.5 3.5l3 3L7 16H4v-3l9.5-9.5z" />
      </svg>
      Edit
    </button>
  );
}
