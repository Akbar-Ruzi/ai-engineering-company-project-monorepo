import EmptyState from "@/components/shared/empty-state";
import ErrorState from "@/components/shared/error-state";
import { formatDateTime } from "@/lib/utils/candidate-format";
import type { Note } from "@/types/note";

// Notes tab body, shared by the drawer and the full page.
// The parent loads the notes (useCandidateNotes), so switching tabs
// doesn't refetch them.
export default function CandidateNotes({
  notes,
  loading,
  error,
  onRetry,
}: {
  notes: Note[];
  loading: boolean;
  error: string | null;
  onRetry: () => void; // GET /records/:id/notes again
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
      <ErrorState
        title="Could not load notes"
        message={error}
        onRetry={onRetry}
      />
    );
  }

  if (notes.length === 0) {
    return (
      <EmptyState
        title="No notes yet"
        description="Notes added after calls or interviews will appear here."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {notes.map((note) => {
        // The API has no author field, so a note shows its text and date only
        const createdAt = formatDateTime(note.created_at);
        return (
          <li
            key={note.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            {/* pre-wrap keeps the line breaks typed into the note */}
            <p className="whitespace-pre-wrap break-words text-slate-800">
              {note.content}
            </p>
            {createdAt && (
              <time
                dateTime={note.created_at}
                className="mt-2 block text-sm text-slate-500"
              >
                {createdAt}
              </time>
            )}
          </li>
        );
      })}
    </ul>
  );
}
