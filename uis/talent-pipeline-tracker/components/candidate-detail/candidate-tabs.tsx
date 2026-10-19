// Overview / Notes tabs, shared by the drawer and the full page.
// Visual only for now: Overview is always the active tab. Step 6 adds the
// Notes content and the switching here, once, for both views.
export default function CandidateTabs({
  notesCount,
  layout,
}: {
  notesCount: number;
  layout: "drawer" | "page";
}) {
  return (
    <nav
      // The full page's header card separates the tabs with a line
      className={`mt-5 flex gap-8 ${
        layout === "page" ? "border-t border-slate-100 pt-3" : ""
      }`}
      aria-label="Candidate sections"
    >
      <span className="border-b-2 border-blue-600 pb-3 font-medium text-blue-600">
        Overview
      </span>
      <span className="flex items-center gap-2 pb-3 text-slate-500">
        Notes
        <span className="rounded-full bg-slate-100 px-2 text-sm">
          {notesCount}
        </span>
      </span>
    </nav>
  );
}
