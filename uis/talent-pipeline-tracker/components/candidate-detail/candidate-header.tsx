import type { ReactNode } from "react";

import { StageBadge, StatusBadge } from "@/components/shared/candidate-badges";
import { getInitials } from "@/lib/utils/candidate-format";
import type { Candidate } from "@/types/candidate";

// Who the candidate is: avatar initials, name, position, status and stage.
// Shared by the drawer and the full page; each wrapper keeps its own frame,
// tabs, and loading/error header.
//   drawer: <h2> that labels the dialog (titleId), long names truncated,
//           badges under the name, the drawer's buttons on the right (actions)
//   page:   <h1>, long names wrap, badges beside the name (tablet/desktop)
//           or on their own row (mobile)
export default function CandidateHeader({
  candidate,
  layout,
  titleId,
  actions,
}: {
  candidate: Candidate;
  layout: "drawer" | "page";
  titleId?: string; // id for the heading, e.g. for aria-labelledby
  actions?: ReactNode; // buttons on the right, e.g. Expand and Close
}) {
  const initials = getInitials(candidate.full_name);
  const badges = (
    <>
      <StatusBadge status={candidate.status} />
      <StageBadge stage={candidate.stage} />
    </>
  );

  if (layout === "drawer") {
    return (
      <>
        <div className="flex items-start gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-lg font-semibold text-blue-700">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id={titleId}
              className="truncate text-2xl font-semibold text-slate-900"
            >
              {candidate.full_name}
            </h2>
            <p className="truncate text-slate-500">{candidate.position}</p>
          </div>
          {actions}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">{badges}</div>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
          {initials}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 id={titleId} className="text-2xl font-semibold text-slate-900">
              {candidate.full_name}
            </h1>
            {/* Tablet/desktop: badges beside the name */}
            <div className="flex gap-2 max-md:hidden">{badges}</div>
          </div>
          <p className="text-slate-500">{candidate.position}</p>
        </div>
        {actions}
      </div>

      {/* Mobile: badges on one full-width row under the name and position */}
      <div className="mt-3 flex gap-2 md:hidden">{badges}</div>
    </>
  );
}
