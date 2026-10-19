"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";

import {
  fullPageHref,
  getDrawerCandidateId,
  listHref,
  toListQuery,
} from "@/lib/utils/candidate-urls";
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

// The dialog is labelled by the heading with this id (in every state)
const TITLE_ID = "candidate-drawer-title";

// Opens over the list when the URL has ?candidate=<id>.
// The list stays mounted underneath, so filters, page, and scroll are kept.
export default function CandidateDrawer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const candidateId = getDrawerCandidateId(searchParams);

  // GET /records/:id; null while the drawer is closed, so nothing is fetched
  const { candidate, loading, error, retry, replaceCandidate } =
    useCandidateDetail(candidateId);

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

  // Expand and Close: shown while loading, on error, and once loaded
  const actions = (
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
  );

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
        aria-labelledby={TITLE_ID}
        className="absolute inset-y-0 right-0 flex w-full flex-col bg-slate-50 shadow-xl md:max-w-xl lg:max-w-2xl"
      >
        <header className="border-b border-slate-200 bg-white px-5 pt-6 sm:px-8">
          {candidate ? (
            <>
              <CandidateHeader
                candidate={candidate}
                layout="drawer"
                titleId={TITLE_ID}
                actions={actions}
              />
              <CandidateTabs
                notesCount={candidate.notes_count}
                layout="drawer"
              />
            </>
          ) : (
            // Loading or error: same layout, with placeholders
            <>
              <div className="flex items-start gap-4">
                {loading && <AvatarSkeleton className="size-14" />}
                <div className="min-w-0 flex-1">
                  {/* Always rendered: the dialog is labelled by this heading */}
                  <h2
                    id={TITLE_ID}
                    className="truncate text-2xl font-semibold text-slate-900"
                  >
                    {loading ? (
                      <>
                        <span className="sr-only">Loading candidate…</span>
                        <SkeletonBar className="mt-1 h-7 w-48" />
                      </>
                    ) : (
                      "Candidate details"
                    )}
                  </h2>
                  {loading && <SkeletonBar className="mt-3 h-4 w-32" />}
                </div>
                {actions}
              </div>
              {loading ? (
                <CandidateHeaderSkeleton tabsClassName="mt-5" />
              ) : (
                <div className="pb-6" />
              )}
            </>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-5 sm:p-8">
          {loading ? (
            <CandidateOverviewSkeleton layout="drawer" />
          ) : error ? (
            <ErrorState
              title="Could not load candidate"
              message={error}
              onRetry={retry}
            />
          ) : candidate ? (
            <CandidateOverview
              candidate={candidate}
              layout="drawer"
              onCandidateChange={replaceCandidate}
            />
          ) : null}
        </div>
      </aside>
    </div>
  );
}
