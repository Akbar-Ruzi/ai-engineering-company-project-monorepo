"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

import {
  fullPageHref,
  getDrawerCandidateId,
  listHref,
  toListQuery,
} from "@/lib/utils/candidate-urls";
import CandidateHeader from "@/components/candidate-detail/candidate-header";
import CandidateOverview from "@/components/candidate-detail/candidate-overview";
import CandidateNotes from "@/components/candidate-detail/candidate-notes";
import CandidateTabs, {
  tabId,
  tabPanelId,
} from "@/components/candidate-detail/candidate-tabs";
import ErrorState from "@/components/shared/error-state";
import {
  AvatarSkeleton,
  CandidateHeaderSkeleton,
  CandidateOverviewSkeleton,
  SkeletonBar,
} from "@/components/candidate-detail/candidate-detail-skeleton";
import { useCandidateDrafts } from "@/context/candidate-drafts";
import { useCandidateDetail } from "@/hooks/useCandidateDetail";
import { useCandidateNotes } from "@/hooks/useCandidateNotes";

// The dialog is labelled by the heading with this id (in every state)
const TITLE_ID = "candidate-drawer-title";

// Everything inside the drawer that Tab can reach
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Tab past the last control goes back to the first, and Shift+Tab before the
// first goes to the last, so keyboard focus never reaches the list behind.
// The controls are looked up on every Tab, since Edit swaps details for inputs.
function trapTab(event: KeyboardEvent, root: HTMLElement) {
  const focusable = Array.from(
    root.querySelectorAll<HTMLElement>(FOCUSABLE),
  ).filter((element) => element.getClientRects().length > 0); // visible only
  if (focusable.length === 0) {
    event.preventDefault();
    root.focus();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;
  const outside = !root.contains(active);

  if (event.shiftKey && (active === first || active === root || outside)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (active === last || outside)) {
    event.preventDefault();
    first.focus();
  }
}

// Opens over the list when the URL has ?candidate=<id>.
// The list stays mounted underneath, so filters, page, and scroll are kept.
export default function CandidateDrawer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const candidateId = getDrawerCandidateId(searchParams);

  // GET /records/:id; null while the drawer is closed, so nothing is fetched
  const { candidate, loading, error, retry, replaceCandidate } =
    useCandidateDetail(candidateId);

  // GET /records/:id/notes for the same ID, loaded alongside the record
  const notes = useCandidateNotes(candidateId);

  // The list query without ?candidate, used by Close and Expand
  const listQuery = toListQuery(searchParams);

  // Close (×), Escape, and the backdrop discard unsaved edits; only Expand
  // carries them to the full page
  const { drafts, setDraft, clearAllDrafts } = useCandidateDrafts();
  const close = useCallback(() => {
    if (candidateId) clearAllDrafts(candidateId);
    router.push(listHref(listQuery), { scroll: false });
  }, [router, listQuery, candidateId, clearAllDrafts]);

  // Kept in the drafts context, so Expand opens the full page on the same tab
  const activeTab = (candidateId && drafts[candidateId]?.tab) || "overview";

  const dialogRef = useRef<HTMLElement>(null);
  const isOpen = candidateId !== null;

  // On open: move focus into the drawer, so the next Tab reaches its buttons.
  // On close: give focus back to what had it before (the row that opened it).
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement;
    dialogRef.current?.focus();
    return () => {
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [isOpen]);

  // Escape closes, Tab stays inside, and the page behind must not scroll
  // while the drawer is open
  useEffect(() => {
    if (!candidateId) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "Tab" && dialogRef.current) {
        trapTab(event, dialogRef.current);
      }
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
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        // -1: focusable from code (on open), but not a Tab stop itself
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-full flex-col bg-slate-50 shadow-xl outline-none md:max-w-xl lg:max-w-2xl"
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
                // The loaded notes are the real count (they change after add
                // or delete); the record's notes_count fills in until then
                notesCount={
                  notes.loading || notes.error
                    ? candidate.notes_count
                    : notes.notes.length
                }
                layout="drawer"
                activeTab={activeTab}
                onTabChange={(tab) => setDraft(candidate.id, "tab", tab)}
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
            <div
              role="tabpanel"
              id={tabPanelId("drawer", activeTab)}
              aria-labelledby={tabId("drawer", activeTab)}
            >
              {activeTab === "overview" ? (
                <CandidateOverview
                  candidate={candidate}
                  layout="drawer"
                  onCandidateChange={replaceCandidate}
                />
              ) : (
                <CandidateNotes
                  candidateId={candidate.id}
                  notes={notes.notes}
                  loading={notes.loading}
                  error={notes.error}
                  onRetry={notes.retry}
                  onNoteAdded={notes.addNote}
                  onNoteRemoved={notes.removeNote}
                />
              )}
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
