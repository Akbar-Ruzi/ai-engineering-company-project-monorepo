import Link from "next/link";

import { StageBadge, StatusBadge } from "@/components/shared/candidate-badges";
import { drawerHref, listHref } from "@/lib/utils/candidate-urls";
import type { CandidateStage, CandidateStatus } from "@/types/candidate";

// Placeholder until GET /records/:id is wired up
const MOCK_CANDIDATE = {
  full_name: "Emily Chen",
  position: "Software Engineer",
  status: "in_progress" as CandidateStatus,
  stage: "technical_interview" as CandidateStage,
};

// Shared look for the Back to Candidates and Drawer View buttons
const NAV_BUTTON =
  "inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:border-slate-400 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500";

// Expanded view at /candidates/[id]. listQuery is the list's search, filters,
// and page, carried over so Back and Drawer View return to the same list.
export default function CandidateFullPage({
  id,
  listQuery,
}: {
  id: string;
  listQuery: string;
}) {
  const candidate = MOCK_CANDIDATE;
  const initials = candidate.full_name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <Link href={listHref(listQuery)} className={NAV_BUTTON}>
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-5"
          >
            <path d="M16 10H4M9 5l-5 5 5 5" />
          </svg>
          Back to Candidates
        </Link>
        {/* Tablet/desktop only: mobile has no drawer */}
        <Link
          href={drawerHref(listQuery, id)}
          className={`${NAV_BUTTON} max-md:hidden`}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            className="size-5"
          >
            <rect x="3" y="4" width="14" height="12" rx="2" />
            <path d="M11 4v12" />
          </svg>
          Drawer View
        </Link>
      </div>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white px-5 pt-6 shadow-sm sm:px-6">
        <div className="flex items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
            {initials}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-slate-900">
                {candidate.full_name}
              </h1>
              <StatusBadge status={candidate.status} />
              <StageBadge stage={candidate.stage} />
            </div>
            <p className="text-slate-500">{candidate.position}</p>
          </div>
        </div>

        {/* Tabs: visual only for now; Notes comes in step 6 */}
        <nav
          className="mt-5 flex gap-8 border-t border-slate-100 pt-3"
          aria-label="Candidate sections"
        >
          <span className="border-b-2 border-blue-600 pb-3 font-medium text-blue-600">
            Overview
          </span>
          <span className="flex items-center gap-2 pb-3 text-slate-500">
            Notes
            <span className="rounded-full bg-slate-100 px-2 text-sm">0</span>
          </span>
        </nav>
      </section>

      <p className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
        Overview content goes here (candidate {id})
      </p>
    </>
  );
}
