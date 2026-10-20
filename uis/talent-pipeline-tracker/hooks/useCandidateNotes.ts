import { useEffect, useRef, useState } from "react";
import type { Note } from "@/types/note";
import { getNotes } from "@/lib/api/notes";

/**
 * ------------Notes tab (drawer and full page)------------
 * One candidate's internal notes from GET /records/:id/notes.
 * id is the same candidate ID used for GET /records/:id; null while the
 * drawer is closed, so nothing is fetched.
 * Called by the drawer and full page (not the Notes tab), so the notes load
 * once per candidate, alongside the record, and switching tabs doesn't refetch.
 */
export function useCandidateNotes(id: string | null) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(id !== null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // The candidate shown now, read by addNote/removeNote after a request finishes
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

  // After a successful POST, show the server's new note (and +1 on the count).
  // Ignored if another candidate was opened while the save was running.
  const addNote = (note: Note) => {
    if (note.record_id !== currentIdRef.current) return;
    setNotes((current) => [...current, note]); // the API lists oldest first
  };

  // After a successful DELETE, drop that note (and -1 on the count).
  // Takes the whole note, like addNote, so the same check applies.
  const removeNote = (note: Note) => {
    if (note.record_id !== currentIdRef.current) return;
    setNotes((current) => current.filter((n) => n.id !== note.id));
  };

  return { notes, loading, error, retry, addNote, removeNote };
}
