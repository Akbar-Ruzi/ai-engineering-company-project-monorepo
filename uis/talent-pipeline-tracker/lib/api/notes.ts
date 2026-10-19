import { apiFetch } from "./api-fetch";
import type { CreateNotePayload, Note, NoteListResponse } from "@/types/note";
import { isNote, isNoteListResponse } from "./validators/note-guards";

// GET /records/:id/notes: all internal notes for one candidate
export async function getNotes(id: string): Promise<NoteListResponse> {
  const data = await apiFetch<unknown>(
    `/records/${encodeURIComponent(id)}/notes`,
  );
  if (!isNoteListResponse(data)) {
    throw new Error("The notes list came back in an unexpected format.");
  }
  return data;
}

// POST /records/:id/notes: add a note to one candidate
export async function createNote({
  id,
  payload,
}: {
  id: string;
  payload: CreateNotePayload;
}): Promise<Note> {
  const data = await apiFetch<unknown>(
    `/records/${encodeURIComponent(id)}/notes`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
  if (!isNote(data)) {
    throw new Error("The new note came back in an unexpected format.");
  }
  return data;
}

// DELETE /records/:id/notes/:note_id: remove one note (204, no body)
export async function deleteNote({
  id,
  noteId,
}: {
  id: string;
  noteId: string;
}): Promise<void> {
  await apiFetch<void>(
    `/records/${encodeURIComponent(id)}/notes/${encodeURIComponent(noteId)}`,
    { method: "DELETE", allowEmpty: true },
  );
}
