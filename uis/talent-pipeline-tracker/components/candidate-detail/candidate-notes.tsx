import type { Note } from "@/types/note";

// Notes tab body, shared by the drawer and the full page.
// The parent loads the notes (useCandidateNotes), so switching tabs
// doesn't refetch them.
// First version: loading, error, and the note text only. The empty state,
// Retry, note cards, and add/delete come in the next step 6 tasks.
export default function CandidateNotes({
  notes,
  loading,
  error,
}: {
  notes: Note[];
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <p role="status" className="text-slate-500">
        Loading notes…
      </p>
    );
  }

  if (error) {
    return (
      <p role="alert" className="text-red-700">
        {error}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {notes.map((note) => (
        <li
          key={note.id}
          className="rounded-xl border border-slate-200 bg-white p-4 text-slate-800 shadow-sm"
        >
          {note.content}
        </li>
      ))}
    </ul>
  );
}
