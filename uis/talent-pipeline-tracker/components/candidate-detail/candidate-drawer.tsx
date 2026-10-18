"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";

import { StageBadge, StatusBadge } from "@/components/shared/candidate-badges";
import {
  fullPageHref,
  getDrawerCandidateId,
  listHref,
  toListQuery,
} from "@/lib/utils/candidate-urls";
import type { CandidateStage, CandidateStatus } from "@/types/candidate";

// Placeholder until GET /records/:id is wired up
const MOCK_CANDIDATE = {
  full_name: "Emily Chen",
  position: "Software Engineer",
  status: "in_progress" as CandidateStatus,
  stage: "technical_interview" as CandidateStage,
};

// Opens over the list when the URL has ?candidate=<id>.
// The list stays mounted underneath, so filters, page, and scroll are kept.
export default function CandidateDrawer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const candidateId = getDrawerCandidateId(searchParams);

  // The list query without ?candidate, used by Close and Expand
  const listQuery = toListQuery(searchParams);

  const close = useCallback(() => {
    router.push(listHref(listQuery), { scroll: false });
  }, [router, listQuery]);

  // Escape closes; the page behind must not scroll while the drawer is open
  useEffect(() => {
    if (!candidateId) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [candidateId, close]);

  if (!candidateId) return null; // If candidateId is null, React renders nothing for this component.

  const candidate = MOCK_CANDIDATE;
  const initials = candidate.full_name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop: dims and blurs the list; clicking it closes the drawer */}
      <div
        aria-hidden="true"
        onClick={close}
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="candidate-drawer-title"
        className="absolute inset-y-0 right-0 flex w-full flex-col bg-slate-50 shadow-xl md:max-w-xl lg:max-w-2xl"
      >
        <header className="border-b border-slate-200 bg-white px-5 pt-6 sm:px-8">
          <div className="flex items-start gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-lg font-semibold text-blue-700">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <h2
                id="candidate-drawer-title"
                className="truncate text-2xl font-semibold text-slate-900"
              >
                {candidate.full_name}
              </h2>
              <p className="truncate text-slate-500">{candidate.position}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Link
                href={fullPageHref(listQuery, candidateId)}
                aria-label="Expand to full page"
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-blue-500"
              >
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
                  <path d="M12 4h4v4M16 4l-5 5M8 16H4v-4M4 16l5-5" />
                </svg>
              </Link>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-blue-500"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  className="size-5"
                >
                  <path d="M5 5l10 10M15 5 5 15" />
                </svg>
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge status={candidate.status} />
            <StageBadge stage={candidate.stage} />
          </div>

          {/* Tabs: visual only for now; Notes comes in step 6 */}
          <nav className="mt-5 flex gap-8" aria-label="Candidate sections">
            <span className="border-b-2 border-blue-600 pb-3 font-medium text-blue-600">
              Overview
            </span>
            <span className="flex items-center gap-2 pb-3 text-slate-500">
              Notes
              <span className="rounded-full bg-slate-100 px-2 text-sm">0</span>
            </span>
          </nav>
        </header>

        <div className="flex-1 overflow-y-auto p-5 sm:p-8">
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
            Overview content goes here (candidate {candidateId})
          </p>
        </div>
      </aside>
    </div>
  );
}
