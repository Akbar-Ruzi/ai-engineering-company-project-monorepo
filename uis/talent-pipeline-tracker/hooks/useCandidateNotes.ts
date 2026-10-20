import { useEffect, useRef, useState } from "react";
import type { Note } from "@/types/note";
import { createNote, deleteNote, getNotes } from "@/lib/api/notes";

/**
 * ------------Notes tab (drawer and full page)------------
 * One candidate's internal notes from GET /records/:id/notes.
 * id is the same candidate ID used for GET /records/:id; null while the
 * drawer is closed, so nothing is fetched.
 * Called by the drawer and full page (not the Notes tab), so the notes load
 * once per candidate, alongside the record, and switching tabs doesn't refetch.
 *
 * Owns the notes data: loading them, and adding or deleting one (API call +
 * list update). Components only own their buttons: saving/deleting state and
 * error messages (the same split as React Query's useMutation).
 */
export function useCandidateNotes(id: string | null) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(id !== null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // The candidate shown now, read by saveNote/removeNote after a request finishes
  const currentIdRef = useRef(id);
  useEffect(() => {
    currentIdRef.current = id;
  }, [id]);

  // Another candidate opened → forget the old notes and show loading.
  // Done during render (not in an effect), so the previous candidate's
  // notes never flash under the new one's ID.
  const [prevId, setPrevId] = useState(id);
  if (id !== prevId) {
    setPrevId(id);
    setNotes([]);
    setLoading(id !== null);
    setError(null);
  }

  useEffect(() => {
    if (id === null) return; // drawer closed: nothing to load

    // Without ignore, a slow reply for the previous candidate can arrive
    // last and show the wrong notes under this candidate's ID.
    let ignore = false; // only the latest request updates the notes
    async function load(candidateId: string) {
      try {
        const response = await getNotes(candidateId);
        if (!ignore) {
          setNotes(response.data);
          setError(null);
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err instanceof Error ? err.message : "Could not load the notes.",
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load(id);
    return () => {
      ignore = true;
    };
  }, [id, reloadKey]);

  const retry = () => {
    setLoading(true); // show "Loading notes…" again
    setError(null);
    setReloadKey((k) => k + 1); // new value → the effect runs again
  };

  // POST /records/:id/notes, then show the server's new note (+1 on the count).
  // Throws on failure, so the caller can show the error and keep the text.
  // The list is left alone if another candidate was opened during the save.
  const saveNote = async (content: string) => {
    if (id === null) throw new Error("No candidate is open.");
    const note = await createNote({ id, payload: { content } });
    if (note.record_id === currentIdRef.current) {
      setNotes((current) => [...current, note]); // the API lists oldest first
    }
  };

  // DELETE /records/:id/notes/:note_id, then drop the note (-1 on the count).
  // The note leaves the list only after the server confirms; a failure throws
  // and the note stays.
  const removeNote = async (note: Note) => {
    await deleteNote({ id: note.record_id, noteId: note.id });
    if (note.record_id === currentIdRef.current) {
      setNotes((current) => current.filter((n) => n.id !== note.id));
    }
  };

  return { notes, loading, error, retry, saveNote, removeNote };
}
