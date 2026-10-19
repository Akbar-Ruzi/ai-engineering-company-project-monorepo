"use client";

import Link from "next/link";

import { drawerHref, listHref } from "@/lib/utils/candidate-urls";
import CandidateHeader from "@/components/candidate-detail/candidate-header";
import CandidateOverview from "@/components/candidate-detail/candidate-overview";
import CandidateTabs from "@/components/candidate-detail/candidate-tabs";
import ErrorState from "@/components/shared/error-state";
import {
  AvatarSkeleton,
  CandidateHeaderSkeleton,
  CandidateOverviewSkeleton,
  SkeletonBar,
} from "@/components/candidate-detail/candidate-detail-skeleton";
import { useCandidateDetail } from "@/hooks/useCandidateDetail";

// Shared look for the Back to Candidates and Drawer View buttons
const NAV_BUTTON =
  "inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:border-slate-400 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500";

// Expanded view at /candidates/[id]. listQuery is the list's search, filters,
// and page, carried over so Back and Drawer View return to the same list.
// A client component: it fetches the candidate with useCandidateDetail.
export default function CandidateFullPage({
  id,
  listQuery,
}: {
  id: string;
  listQuery: string;
}) {
  // GET /records/:id for the [id] in the URL
  const { candidate, loading, error, retry, replaceCandidate } =
    useCandidateDetail(id);

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

      {loading ? (
        <>
          {/* Same box as the header card below */}
          <section className="mt-5 rounded-2xl border border-slate-200 bg-white px-5 pt-6 shadow-sm sm:px-6">
            <h1 className="sr-only">Loading candidate…</h1>
            <div className="flex items-center gap-4">
              <AvatarSkeleton className="size-12" />
              <div className="min-w-0 flex-1">
                <SkeletonBar className="h-7 w-48 max-w-full" />
                <SkeletonBar className="mt-2 h-4 w-32" />
              </div>
            </div>
            <CandidateHeaderSkeleton tabsClassName="mt-5 border-t border-slate-100 pt-3" />
          </section>

          <div className="mt-5">
            <CandidateOverviewSkeleton layout="page" />
          </div>
        </>
      ) : error ? (
        <ErrorState
          title="Could not load candidate"
          message={error}
          onRetry={retry}
        />
      ) : candidate ? (
        <>
          <section className="mt-5 rounded-2xl border border-slate-200 bg-white px-5 pt-6 shadow-sm sm:px-6">
            <CandidateHeader candidate={candidate} layout="page" />

            <CandidateTabs notesCount={candidate.notes_count} layout="page" />
          </section>

          <div className="mt-5">
            <CandidateOverview
              candidate={candidate}
              layout="page"
              onCandidateChange={replaceCandidate}
            />
          </div>
        </>
      ) : null}
    </>
  );
}
