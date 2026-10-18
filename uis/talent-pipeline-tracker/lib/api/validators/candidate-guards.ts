// Type guards for candidate (records) responses.
// They check at runtime that data from the API actually has the shape
// the TypeScript types claim, so a broken answer shows an error instead of a blank view.

import { STAGE_LABELS, STATUS_LABELS } from "@/lib/constants";
import type { Candidate, CandidateListResponse } from "@/types/candidate";
import { isObject, isStringOrNull } from "./common-guards";

// A full candidate (backend RecordOut), as returned by GET /records,
// GET /records/:id, PUT and PATCH: every field the list and detail views
// display, and a status/stage we have a UI label for.
export function isCandidate(item: unknown): item is Candidate {
  return (
    isObject(item) &&
    typeof item.id === "string" &&
    typeof item.full_name === "string" &&
    typeof item.email === "string" &&
    typeof item.phone === "string" &&
    typeof item.position === "string" &&
    isStringOrNull(item.linkedin_url) &&
    isStringOrNull(item.cv_url) &&
    typeof item.status === "string" &&
    Object.hasOwn(STATUS_LABELS, item.status) &&
    typeof item.stage === "string" &&
    Object.hasOwn(STAGE_LABELS, item.stage) &&
    typeof item.experience_years === "number" &&
    typeof item.applied_at === "string" &&
    typeof item.updated_at === "string" &&
    typeof item.notes_count === "number"
  );
}

// One page of candidates from GET /records.
export function isCandidateListResponse(
  value: unknown,
): value is CandidateListResponse {
  return (
    isObject(value) &&
    typeof value.total === "number" &&
    typeof value.page === "number" &&
    typeof value.limit === "number" &&
    Array.isArray(value.data) &&
    value.data.every(isCandidate)
  );
}
