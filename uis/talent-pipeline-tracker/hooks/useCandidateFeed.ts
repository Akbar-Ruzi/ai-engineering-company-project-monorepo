import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { Candidate, ListFilters } from "@/types/candidate";
import { getRecords } from "@/lib/api/records";
import { PAGE_SIZE } from "@/lib/constants";

/**
 * -------------Mobile cards------------
 * a feed that grows as the user scrolls.
 * Each new page is added to the end; already-loaded cards stay.
 */
export function useCandidateFeed({ status, stage, search }: ListFilters) {
  const [candidates, setCandidates] = useState<Candidate[]>([]); //  holds all cards loaded so far, and only grows.
  const [total, setTotal] = useState(0);// is the count from the API (100), used to know when to stop.
  const [lastPage, setLastPage] = useState(0); // the last page added, so the next request is lastPage + 1.
  const [loading, setLoading] = useState(true); // first page is loading
  const [error, setError] = useState<string | null>(null); // first page failed
  const [loadingMore, setLoadingMore] = useState(false); // next page is loading
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null); // last next page failed
  const [ended, setEnded] = useState(false); // a page came back empty: nothing more to load
  const [reloadKey, setReloadKey] = useState(0); // a counter; bumping it re-runs the first-page effect
  // a "busy" flag kept as a ref instead of state, because a ref updates instantly. If the observer fires twice in a row,  
  // the second call sees true and stops. State wouldn't change until the next render, so both calls could get through. 
  const loadingMoreRef = useRef(false); // updates instantly, unlike state, so two quick calls can't both start
  const loadMoreAreaRef = useRef<HTMLDivElement>(null); //  points at the <div> around <LoadMore>, the element the scroll watcher looks at.
  // Which list is current. Bumped each time the first page reloads, so a
  // loadMore reply that started for an older list can tell it's out of date.
  const listIdRef = useRef(0);
  // cacheComponents keeps this page alive (hidden in React <Activity>) while the
  // user is on a candidate's full page. State survives, but effects re-run when
  // the page shows again. loadedKeyRef remembers which filters page 1 was loaded
  // for, so that re-run doesn't refetch page 1 and throw away the extra pages.
  const loadedKeyRef = useRef<string | null>(null);
  const savedScrollRef = useRef<number | null>(null); // scroll position when a card was opened

  // Search or filters changed → throw away the old cards and show the skeleton.
  // Done during render (not in an effect), so old cards are never shown under the new filters.
  const filterKey = `${status ?? ""}|${stage ?? ""}|${search ?? ""}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setCandidates([]);
    setTotal(0);
    setLastPage(0);
    setLoading(true);
    setError(null);
    setLoadingMore(false);
    setLoadMoreError(null);
    setEnded(false);
  }

  // First page: its own request, independent of the table
  useEffect(() => {
    // Page shown again after the full page: the cards are still here, keep them
    const loadKey = `${filterKey}|${reloadKey}`;
    if (loadedKeyRef.current === loadKey) return;

    listIdRef.current += 1; // a new list starts; older loadMore replies no longer belong to it
    loadingMoreRef.current = false; // an old loadMore still in flight must not block the new list
    let ignore = false; // only the latest request updates the feed

    async function load() {
      try {
        const response = await getRecords({ page: 1, limit: PAGE_SIZE, status, stage, search });
        if (!ignore) {
          loadedKeyRef.current = loadKey;
          setCandidates(response.data);
          setTotal(response.total);
          setLastPage(1);
          setError(null);
          setLoadMoreError(null);
          setEnded(false);
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
  }, [reloadKey, status, stage, search, filterKey]);

  // Runs on mount and again each time the page shows after the full page.
  // Navigation scrolls to the top, so scroll back to where the card was opened.
  // Two frames, so it runs after the navigation's own scroll.
  useEffect(() => {
    const y = savedScrollRef.current;
    if (y === null) return;
    // Not cleared here: in dev React runs this effect twice, and the first
    // run's cleanup cancels the frame. Clearing late lets the second run scroll.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        savedScrollRef.current = null; // cleared only once it has scrolled
        window.scrollTo(0, y);
      });
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // Called when a card opens the full page
  const rememberScroll = () => {
    savedScrollRef.current = window.scrollY;
  };

  const loadMore = async () => {
    // Guards: one request at a time, stop at the end
    if (loadingMoreRef.current || ended || candidates.length >= total) return;

    const nextPage = lastPage + 1; // computed once, used for the request and the state
    const listId = listIdRef.current; // the list this request belongs to
    const isOutdated = () => listId !== listIdRef.current; // filters changed while waiting
    loadingMoreRef.current = true;
    setLoadingMore(true);
    setLoadMoreError(null);
    try {
      const response = await getRecords({ page: nextPage, limit: PAGE_SIZE, status, stage, search });
      if (isOutdated()) return; // drop it: these cards belong to the old filters
      if (response.data.length === 0) {
        setEnded(true); // past the last page (candidates were removed): stop here
      } else {
        setCandidates((prev) => [...prev, ...response.data]); // add to the end
        setLastPage(nextPage);
      }
    } catch (err) {
      if (isOutdated()) return; // an old list's error must not show under the new one
      setLoadMoreError(
        err instanceof Error ? err.message : "Could not load more candidates.",
      ); // already-loaded cards stay on screen
    } finally {
      // Only the current list's request may clear the busy flag;
      // otherwise an old reply could unlock it while a new loadMore is running.
      if (!isOutdated()) {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  };

  const retry = () => {
    setLoading(true); // show the skeleton again
    setError(null);
    setReloadKey((k) => k + 1); // new value → the first-page effect runs again
  };

  // Called by the observer. useEffectEvent always sees the latest state,
  // so the observer doesn't need to be recreated when loadMore changes.
  // onLoadMoreAreaVisible decides what "visible" means for the app.
  // If the callback called loadMore() directly, it would keep the loadMore from that first render, with old candidates, lastPage and loadMoreError. 
  // Wrapping the logic in useEffectEvent gives the callback a function that always reads the latest state, without recreating the observer each time state changes.
  const onLoadMoreAreaVisible = useEffectEvent(() => {
    if (loadMoreError) return; // after a failure only "Try again" retries
    loadMore();
  });
  /* The flow is: the observer sees the area → its callback checks it's visible → it calls onLoadMoreAreaVisible → that calls loadMore(). */
  useEffect(() => {
    const area = loadMoreAreaRef.current;
    if (!area) return; // the cards aren't on screen (loading, error, or empty)
    // An IntersectionObserver is observer,  watches the area under the last card. When that area comes within 200px of the screen (rootMargin),
    //  it loads the next page, so new cards are usually ready before the user reaches the bottom.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) onLoadMoreAreaVisible();// Runs on every report and checks isIntersecting, meaning "is the area visible now?"
      },
      { rootMargin: "200px" }, // start loading a little before the user reaches the end
    );
    observer.observe(area);
    return () => observer.disconnect();
    // loading/error: the area only exists once the cards are shown.
    // candidates.length: re-observe after each page, so if the area is
    // still in view the observer reports it again and the next page loads.
  }, [loading, error, candidates.length]);

  return {
    candidates,
    total: ended ? candidates.length : total, // after an empty page, what we have is everything
    loading,
    error,
    retry,
    loadingMore,
    loadMoreError,
    loadMore,
    rememberScroll, // call when a card opens the full page
    loadMoreAreaRef, // attach to the wrapper around <LoadMore>
  };
}
