"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

import type { Candidate, CandidateFormValues } from "@/types/candidate";

// Unsaved edits, by candidate ID. The drawer and the full page each render
// their own cards, so a draft kept inside one card would be lost on Expand or
// Drawer View. Kept here (above both routes), the other view opens the same
// form with the same values. Cancel or a successful save removes the draft;
// a page reload forgets all drafts.
export type CandidateDraft = {
  general?: CandidateFormValues; // General information form
  progress?: Pick<Candidate, "status" | "stage">; // Recruitment progress form
};
type DraftPart = keyof CandidateDraft; // "general" | "progress"

type CandidateDrafts = {
  drafts: Record<string, CandidateDraft>;
  setDraft: <K extends DraftPart>(
    id: string,
    part: K,
    values: NonNullable<CandidateDraft[K]>,
  ) => void;
  clearDraft: (id: string, part: DraftPart) => void;
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
      if (!current[id]?.[part]) return current; // no draft: nothing to change
      const next = { ...current, [id]: { ...current[id] } };
      delete next[id][part];
      return next;
    });
  }, []);

  // Same object between renders unless a draft changes
  const value = useMemo(
    () => ({ drafts, setDraft, clearDraft }),
    [drafts, setDraft, clearDraft],
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
