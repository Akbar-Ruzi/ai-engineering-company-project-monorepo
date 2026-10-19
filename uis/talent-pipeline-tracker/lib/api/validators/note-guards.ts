// Type guards for note responses.
// They check at runtime that data from the API actually has the shape
// the TypeScript types claim, so a broken answer shows an error in the Notes tab.
// DELETE returns 204 No Content, so it has no guard.

import type { Note, NoteListResponse } from "@/types/note";
import { isObject } from "./common-guards";

// One note, as returned in GET /records/:id/notes and by POST /records/:id/notes.
export function isNote(item: unknown): item is Note {
  return (
    isObject(item) &&
    typeof item.id === "string" &&
    typeof item.record_id === "string" &&
    typeof item.content === "string" &&
    typeof item.created_at === "string"
  );
}

// A candidate's notes from GET /records/:id/notes.
export function isNoteListResponse(value: unknown): value is NoteListResponse {
  return (
    isObject(value) &&
    Array.isArray(value.data) &&
    value.data.every(isNote) &&
    isObject(value.meta) &&
    typeof value.meta.total === "number"
  );
}
