import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SEARCH_DELAY_MS, STAGE_LABELS, STATUS_LABELS } from "@/lib/constants";
import type { CandidateStage, CandidateStatus } from "@/types/candidate";

// A value from the URL counts only if it's a real API value;
// anything else (?status=bogus) means "no filter", not an empty list.

function toStatus(value: string | null): CandidateStatus | undefined {
  return value && Object.hasOwn(STATUS_LABELS, value)
    ? (value as CandidateStatus)
    : undefined;
}

function toStage(value: string | null): CandidateStage | undefined {
  return value && Object.hasOwn(STAGE_LABELS, value)
    ? (value as CandidateStage)
    : undefined;
}

// A page counts only if it's a whole number from 1 up, written plainly.
// "abc", "-3", "0", "1.5" and "007" are all rejected, and the list shows page 1.
function toPage(value: string | null): number | undefined {
  const page = Number(value);
  return value !== null &&
    Number.isSafeInteger(page) &&
    page >= 1 &&
    String(page) === value
    ? page
    : undefined;
}

// Status, stage and page live in the URL, so refreshing or sharing the link keeps them.
// Search lives in local state: it updates on every keystroke without touching the URL.
export function useRecordsFilters() {
  // search: what the input shows, updated on every keystroke.
  // searchQuery: what gets sent to the API, updated once typing pauses.
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Each keystroke cancels the previous timer, so only the last one fires.
  // trim(): "michael " and "michael" are the same search, so no extra request.
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(search.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const searchParams = useSearchParams(); // gives you a read-only interface. You cannot directly modify its parameters.
  const router = useRouter();
  const pathname = usePathname();

  const status = toStatus(searchParams.get("status")); // 1. searchParams.get("status") reads the value from the URL. 2. toStatus() validates it.
  const stage = toStage(searchParams.get("stage"));
  const pageParam = toPage(searchParams.get("page"));
  const page = pageParam ?? 1; // no page, or a bad one → page 1

  //  it updates the URL without reloading the page and without adding a history entry for every dropdown change.
  const replaceQuery = useCallback(
    (params: URLSearchParams) => {
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      }); // no trailing "?"
    },
    [router, pathname],
  );

  // A bad value in the URL (?status=bogus, ?page=abc) is already ignored above;
  // this also removes it from the URL, so the link matches what's on screen.
  const hasBadStatus = searchParams.has("status") && !status;
  const hasBadStage = searchParams.has("stage") && !stage;
  const hasBadPage = searchParams.has("page") && !pageParam;
  useEffect(() => {
    if (!hasBadStatus && !hasBadStage && !hasBadPage) return;
    const params = new URLSearchParams(searchParams.toString()); // keep unrelated params
    if (hasBadStatus) params.delete("status");
    if (hasBadStage) params.delete("stage");
    if (hasBadPage) params.delete("page");
    replaceQuery(params);
  }, [hasBadStatus, hasBadStage, hasBadPage, searchParams, replaceQuery]);

  // A new search → back to page 1. Search isn't in the URL, so this can't
  // happen in setFilter; it runs once searchQuery changes after the typing pause.
  // The ref skips the first render, so a bookmarked ?page=3 isn't wiped on load.
  const prevSearchQueryRef = useRef(searchQuery);
  useEffect(() => {
    if (prevSearchQueryRef.current === searchQuery) return;
    prevSearchQueryRef.current = searchQuery;
    if (!searchParams.has("page")) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    replaceQuery(params);
  }, [searchQuery, searchParams, replaceQuery]);

  const setFilter = (key: "status" | "stage", value: string) => {
    const params = new URLSearchParams(searchParams.toString()); // keep unrelated params
    if (value) params.set(key, value);
    else params.delete(key); // "All statuses" removes the key
    params.delete("page"); // new filters → back to page 1, in the same URL change
    replaceQuery(params);
  };

  const setPage = (nextPage: number) => {
    if (nextPage === page) return; // clicking the current page does nothing
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage > 1) params.set("page", String(nextPage));
    else params.delete("page"); // page 1 is the default, so keep the URL short
    replaceQuery(params);
  };

  // Something to clear? Uses `search` (the input), so a just-typed word counts too.
  const hasActiveFilters = Boolean(search || status || stage);

  // Clear filters: empty the search and remove status/stage/page from the URL.
  const clearFilters = () => {
    setSearch("");
    setSearchQuery(""); // right away, no 300 ms wait: the full list comes back at once

    if (["status", "stage", "page"].some((key) => searchParams.has(key))) {
      const params = new URLSearchParams(searchParams.toString()); // keep unrelated params
      params.delete("status");
      params.delete("stage");
      params.delete("page");
      replaceQuery(params);
    }
  };

  return {
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
  };
}
