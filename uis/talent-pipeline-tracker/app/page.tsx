"use client";

import { PAGE_SIZE } from "@/lib/constants";
import { useCandidateFeed } from "@/hooks/useCandidateFeed";
import { useCandidatePage } from "@/hooks/useCandidatePage";

import AppHeader from "@/components/shared/app-header";
import CandidateCards from "@/components/candidate-list/candidate-cards";
import CandidateFilters from "@/components/candidate-list/candidate-filters";
import CandidateTable from "@/components/candidate-list/candidate-table";
import CandidatesHeader from "@/components/candidate-list/candidates-header";
import Pagination from "@/components/candidate-list/pagination";
import CandidateListSkeleton from "@/components/candidate-list/candidate-list-skeleton";
import EmptyState from "@/components/shared/empty-state";
import ErrorState from "@/components/shared/error-state";
import LoadMore from "@/components/candidate-list/load-more";

export default function Home() {
   // tablet/desktop: one page at a time
  const table = useCandidatePage();
  
  // mobile: grows as the user scrolls. The ref is kept separate from `feed`,
  // so reading feed's state during render isn't treated as reading a ref.
  const { loadMoreAreaRef, ...feed } = useCandidateFeed();

  const handlePageChange = (nextPage: number) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    table.setPage(nextPage);
  };

  return (
    <div className="flex flex-1 flex-col bg-slate-50 text-slate-900">
      <AppHeader />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <CandidatesHeader />

        <div className="mt-6 sm:mt-8">
          <CandidateFilters />
        </div>

        {/* Mobile: count + cards + auto-load status */}
        <div className="md:hidden">
          {feed.loading ? (
            <CandidateListSkeleton />
          ) : feed.error ? (
            <ErrorState
              title="Could not load candidates"
              message={feed.error}
              onRetry={feed.retry}
            />
          ) : feed.total === 0 ? (
            <EmptyState title="No candidates yet" />
          ) : (
            <section className="mt-4" aria-label="Candidates">
              <p className="mb-3 text-sm font-semibold text-slate-500">
                {feed.total} candidates
              </p>
              <CandidateCards candidates={feed.candidates} />
              <div ref={loadMoreAreaRef} className="mt-6">
                <LoadMore
                  loaded={feed.candidates.length}
                  total={feed.total}
                  loading={feed.loadingMore}
                  error={feed.loadMoreError}
                  onRetry={feed.loadMore}
                />
              </div>
            </section>
          )}
        </div>

        {/* Tablet and desktop: table with pagination footer */}
        <div className="hidden md:block">
          {table.loading ? (
            <CandidateListSkeleton />
          ) : table.error ? (
            <ErrorState
              title="Could not load candidates"
              message={table.error}
              onRetry={table.retry}
            />
          ) : table.result && table.result.total === 0 ? (
            <EmptyState title="No candidates yet" />
          ) : table.result ? (
            <section
              className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              aria-label="Candidates"
            >
              <CandidateTable candidates={table.result.data} />
              <div className="border-t border-slate-200 px-6 py-4 lg:px-8">
                <Pagination
                  total={table.result.total}
                  page={table.page}
                  limit={PAGE_SIZE}
                  onPageChange={handlePageChange}
                />
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
}
