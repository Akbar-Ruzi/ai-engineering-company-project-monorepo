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

// Highest Years of Experience the candidate form accepts. Our own rule:
// the API only requires a number, so it would also accept e.g. 814.
export const MAX_EXPERIENCE_YEARS = 60;

// How long a success message (e.g. "Recruitment progress saved.") stays visible
export const SUCCESS_MESSAGE_MS = 3000;

// URL parameter that holds the open drawer's candidate ID (/?candidate=<id>)
export const DRAWER_PARAM = "candidate";

// Stands in for a candidate ID to open the create form instead:
// /?candidate=new (drawer) and /candidates/new (full page).
// Real IDs are UUIDs, so it can't clash with a candidate.
export const NEW_CANDIDATE_ID = "new";
