// One internal note on a candidate, as returned by GET /records/:id/notes
// (also the response of POST /records/:id/notes)
export type Note = {
  id: string;
  record_id: string; // the candidate's id
  content: string;
  created_at: string; // ISO date, e.g. "2026-02-28T20:04:32.114Z"
};

// The wrapper around a candidate's notes (no pagination)
export type NoteListResponse = {
  data: Note[];
  meta: {
    total: number; // all notes for this candidate
  };
};

// Body for POST /records/:id/notes (backend schema NoteCreate).
// content is required and must not be empty (minLength 1).
// Response: the created Note (201).
export type CreateNotePayload = {
  content: string;
};

// DELETE /records/:id/notes/:note_id returns 204 No Content,
// so the delete function returns Promise<void> and needs no response type.
