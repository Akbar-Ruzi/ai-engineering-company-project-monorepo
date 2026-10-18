import type { CandidateStage, CandidateStatus } from "@/types/candidate";
export const STATUS_LABELS: Record<CandidateStatus, string> = {
  received: "Received",
  in_progress: "In progress",
  selected: "Selected",
  discarded: "Discarded",
};

export const STAGE_LABELS: Record<CandidateStage, string> = {
  pending: "Pending review",
  review: "Under review",
  personal_interview: "Personal interview",
  technical_interview: "Technical interview",
  offer_presented: "Offer presented",
};

export const PAGE_SIZE = 10;

// Wait this long after the last keystroke before searching
export const SEARCH_DELAY_MS = 300;

// URL parameter that holds the open drawer's candidate ID (/?candidate=<id>)
export const DRAWER_PARAM = "candidate";
