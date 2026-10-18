"use client";

import { PAGE_SIZE } from "@/lib/constants";
import { useCandidateFeed } from "@/hooks/useCandidateFeed";
import { useCandidatePage } from "@/hooks/useCandidatePage";
import { useRecordsFilters } from "@/hooks/useRecordsFilters";

import CandidateCards from "@/components/candidate-list/candidate-cards";
import CandidateFilters from "@/components/candidate-list/candidate-filters";
import CandidateTable from "@/components/candidate-list/candidate-table";
import Pagination from "@/components/candidate-list/pagination";
import CandidateListSkeleton from "@/components/candidate-list/candidate-list-skeleton";
import EmptyState from "@/components/shared/empty-state";
import ErrorState from "@/components/shared/error-state";
import LoadMore from "@/components/candidate-list/load-more";

// Filters + both list views. A client component because it reads the URL and fetches.
export default function CandidateList() {
  // status and stage from the URL (?status=…&stage=…), search from local state
  const {
    status,
    stage,
    setFilter,
    page,
    setPage,
    search,
    setSearch,
    searchQuery,
    hasActiveFilters,
    clearFilters,
  } = useRecordsFilters();

  // Both lists get searchQuery (sent after typing pauses), not search (every keystroke)
  const filters = { status, stage, search: searchQuery };

  // tablet/desktop: one page at a time, page number from the URL (?page=…).
  // A page past the end jumps to a valid one (setPage updates the URL).
  const table = useCandidatePage({ ...filters, page, onPageOutOfRange: setPage });

  // mobile: grows as the user scrolls. The ref is kept separate from `feed`,
  // so reading feed's state during render isn't treated as reading a ref.
  const { loadMoreAreaRef, ...feed } = useCandidateFeed(filters);

  // total 0 means two different things: nothing in the database yet,
  // or nothing matches. Uses searchQuery (what was sent), not search (what's typed),
  // so the message always describes the results on screen.
  const isFiltered = Boolean(searchQuery || status || stage);
  const emptyState = isFiltered ? (
    <EmptyState
      title="No matching candidates"
      description="Try a different name or email, or change the status and stage filters."
      actionLabel="Clear filters"
      onAction={clearFilters}
    />
  ) : (
    <EmptyState title="No candidates yet" />
  );

  const handlePageChange = (nextPage: number) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setPage(nextPage);
  };

  return (
    <>
      <div className="mt-6 sm:mt-8">
        <CandidateFilters
          search={search}
          onSearchChange={setSearch}
          status={status}
          stage={stage}
          onFilterChange={setFilter}
          hasActiveFilters={hasActiveFilters}
          onClear={clearFilters}
        />
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
          emptyState
        ) : (
          <section className="mt-4" aria-label="Candidates">
            <p className="mb-3 text-sm font-semibold text-slate-500">
              {feed.total} candidates
            </p>
            <CandidateCards
              candidates={feed.candidates}
              onOpen={feed.rememberScroll}
            />
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
          emptyState
        ) : table.result ? (
          <section
            className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            aria-label="Candidates"
          >
            <CandidateTable candidates={table.result.data} />
            <div className="border-t border-slate-200 px-6 py-4 lg:px-8">
              <Pagination
                total={table.result.total}
                page={page}
                limit={PAGE_SIZE}
                onPageChange={handlePageChange}
              />
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
