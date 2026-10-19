import { useEffect, useEffectEvent, useState } from "react";
import type { CandidateListResponse, ListFilters } from "@/types/candidate";
import { getRecords } from "@/lib/api/records";
import { PAGE_SIZE } from "@/lib/constants";

type CandidateTableOptions = ListFilters & {
  page: number; // from the URL (?page=…)
  saveCount: number; // changes after a candidate is saved → refetch this page
  onPageOutOfRange: (page: number) => void; // called with a valid page to jump to
};

/**
 * ------------Tablet/desktop------------
 *  table: one numbered page at a time.
 * The page comes from the URL; this hook only fetches it.
 * Changing the page replaces the rows; nothing is kept from the previous page.
 */
export function useCandidateTable({
  status,
  stage,
  search,
  page,
  saveCount,
  onPageOutOfRange,
}: CandidateTableOptions) {
  const [result, setResult] = useState<CandidateListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Page, search or filters changed → show the skeleton.
  // saveCount is left out on purpose: after a save the current rows stay on
  // screen and are swapped for the fresh ones when they arrive (no flash).
  // Done during render (not in an effect), so the old rows never show under the new request.
  // Going back to page 1 on a filter change is done in the URL (useRecordsFilters).
  const requestKey = `${status ?? ""}|${stage ?? ""}|${search ?? ""}|${page}`;
  const [prevRequestKey, setPrevRequestKey] = useState(requestKey);
  if (requestKey !== prevRequestKey) {
    setPrevRequestKey(requestKey);
    setLoading(true);
  }

  useEffect(() => {
    // Without ignore, a slow, older reply can arrive last and overwrite the table. The rows then don't match the highlighted page.
    let ignore = false; // only the latest request updates the table
    async function load() {
      try {
        const response = await getRecords({
          page,
          limit: PAGE_SIZE,
          status,
          stage,
          search,
        });
        if (!ignore) {
          setResult(response);
          setError(null);
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err instanceof Error ? err.message : "Could not load candidates.",
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [reloadKey, page, status, stage, search, saveCount]);

  // Out of range: candidates exist (total > 0) but this page came back empty,
  // e.g. ?page=99, an old bookmark, or fewer results after candidates were removed.
  const isOutOfRange =
    !loading &&
    !error &&
    result !== null &&
    result.total > 0 &&
    result.data.length === 0 &&
    page > 1;
  const lastPage = result
    ? Math.max(1, Math.ceil(result.total / PAGE_SIZE))
    : 1;

  // useEffectEvent: always calls the latest onPageOutOfRange without re-running the effect
  const reportOutOfRange = useEffectEvent((validPage: number) =>
    onPageOutOfRange(validPage),
  );
  useEffect(() => {
    // Math.min with page - 1: always moves back, so it can never jump to the same empty page again
    if (isOutOfRange) reportOutOfRange(Math.min(lastPage, page - 1));
  }, [isOutOfRange, lastPage, page]);

  const retry = () => {
    setLoading(true); // show the skeleton again
    setError(null);
    setReloadKey((k) => k + 1); // new value → the effect runs again
  };

  // While out of range, report loading: the skeleton shows instead of an empty table
  return { result, loading: loading || isOutOfRange, error, retry };
}
