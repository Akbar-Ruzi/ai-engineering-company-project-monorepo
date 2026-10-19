"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

// Tells the list that a candidate was saved in the drawer or full page
// (PATCH/PUT), so it refetches and shows the new values. A refetch (not a
// local patch) also drops candidates that no longer match the filters.
// The list and the details are separate components (and, for the full page,
// separate routes), so this can't simply be passed as a prop.
type CandidateUpdates = {
  // Goes up by one after every save; the list refetches when it changes
  saveCount: number;
  // Call after a successful save
  notifyCandidateSaved: () => void;
};

const CandidateUpdatesContext = createContext<CandidateUpdates | null>(null);

export function CandidateUpdatesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [saveCount, setSaveCount] = useState(0);

  const notifyCandidateSaved = useCallback(() => {
    setSaveCount((count) => count + 1);
  }, []);

  // Same object between renders unless saveCount changes, so consumers
  // don't re-render on every provider render
  const value = useMemo(
    () => ({ saveCount, notifyCandidateSaved }),
    [saveCount, notifyCandidateSaved],
  );

  return (
    <CandidateUpdatesContext value={value}>{children}</CandidateUpdatesContext>
  );
}

export function useCandidateUpdates(): CandidateUpdates {
  const context = useContext(CandidateUpdatesContext);
  if (!context) {
    throw new Error(
      "useCandidateUpdates must be used inside CandidateUpdatesProvider.",
    );
  }
  return context;
}
