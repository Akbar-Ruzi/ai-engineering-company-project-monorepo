import { useEffect, useState } from "react";
import type { CandidateListResponse } from "@/types/candidate";
import { getRecords } from "@/lib/api/records";
import { PAGE_SIZE } from "@/lib/constants";

/**
 * ------------Tablet/desktop------------
 *  table: one numbered page at a time.
 * holds one page of results at a time (page, setPage)
 * Changing the page replaces the rows; nothing is kept from the previous page.
 */
export function useCandidatePage() {
  const [result, setResult] = useState<CandidateListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPageState] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    // Without ignore, a slow, older reply can arrive last and overwrite the table. The rows then don't match the highlighted page.
    let ignore = false; // only the latest request updates the table
    async function load() {
      try {
        const response = await getRecords({ page, limit: PAGE_SIZE });
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
  }, [reloadKey, page]);

  const setPage = (nextPage: number) => {
    if (nextPage === page) return; // clicking the current page does nothing
    setLoading(true);
    setPageState(nextPage);
  };

  const retry = () => {
    setLoading(true); // show the skeleton again
    setError(null);
    setReloadKey((k) => k + 1); // new value → the effect runs again
  };

  return { result, loading, error, page, setPage, retry };
}
