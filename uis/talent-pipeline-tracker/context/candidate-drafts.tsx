"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

import type {
  Candidate,
  CandidateFormValues,
  CandidateTab,
} from "@/types/candidate";

// Unsaved edits, by candidate ID. The drawer and the full page each render
// their own cards, so a draft kept inside one card would be lost on Expand or
// Drawer View. Kept here (above both routes), the other view opens the same
// form with the same values. Cancel or a successful save removes the draft,
// leaving the detail views (drawer Close, full page Back to Candidates)
// discards all of that candidate's drafts, and a page reload forgets them all.
// The selected tab is kept here for the same reason, so Expand and Drawer View
// open the tab the user was on (and leaving the views resets it to Overview).
export type CandidateDraft = {
  general?: CandidateFormValues; // General information form
  progress?: Pick<Candidate, "status" | "stage">; // Recruitment progress form
  tab?: CandidateTab; // Overview / Notes; missing means Overview
  noteDraft?: string; // New note text; present (even "") means the composer is open
  deletingNoteId?: string; // The note whose delete confirmation is open
};
type DraftPart = keyof CandidateDraft; // "general" | "progress" | "tab" | ...

type CandidateDrafts = {
  drafts: Record<string, CandidateDraft>;
  setDraft: <K extends DraftPart>(
    id: string,
    part: K,
    values: NonNullable<CandidateDraft[K]>,
  ) => void;
  clearDraft: (id: string, part: DraftPart) => void;
  clearAllDrafts: (id: string) => void; // every part, e.g. when the drawer closes
};

const CandidateDraftsContext = createContext<CandidateDrafts | null>(null);

export function CandidateDraftsProvider({ children }: { children: ReactNode }) {
  const [drafts, setDrafts] = useState<Record<string, CandidateDraft>>({});

  const setDraft = useCallback(
    <K extends DraftPart>(
      id: string,
      part: K,
      values: NonNullable<CandidateDraft[K]>,
    ) => {
      setDrafts((current) => ({
        ...current,
        [id]: { ...current[id], [part]: values },
      }));
    },
    [],
  );

  const clearDraft = useCallback((id: string, part: DraftPart) => {
    setDrafts((current) => {
      // no draft: nothing to change ("" is still a draft: an open, empty composer)
      if (current[id]?.[part] === undefined) return current;
      const next = { ...current, [id]: { ...current[id] } };
      delete next[id][part];
      return next;
    });
  }, []);

  const clearAllDrafts = useCallback((id: string) => {
    setDrafts((current) => {
      if (!(id in current)) return current; // no drafts: nothing to change
      const next = { ...current };
      delete next[id];
      return next;
    });
  }, []);

  // Same object between renders unless a draft changes
  const value = useMemo(
    () => ({ drafts, setDraft, clearDraft, clearAllDrafts }),
    [drafts, setDraft, clearDraft, clearAllDrafts],
  );

  return (
    <CandidateDraftsContext value={value}>{children}</CandidateDraftsContext>
  );
}

export function useCandidateDrafts(): CandidateDrafts {
  const context = useContext(CandidateDraftsContext);
  if (!context) {
    throw new Error(
      "useCandidateDrafts must be used inside CandidateDraftsProvider.",
    );
  }
  return context;
}
