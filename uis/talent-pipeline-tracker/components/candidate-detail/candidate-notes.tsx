import { useEffect, useId, useRef, useState } from "react";
import type { SubmitEvent } from "react";

import EmptyState from "@/components/shared/empty-state";
import ErrorState from "@/components/shared/error-state";
import SuccessMessage from "@/components/shared/success-message";
import { createNote } from "@/lib/api/notes";
import { SUCCESS_MESSAGE_MS } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils/candidate-format";
import type { Note } from "@/types/note";

// Notes tab body, shared by the drawer and the full page.
// The parent loads the notes (useCandidateNotes), so switching tabs
// doesn't refetch them.
export default function CandidateNotes({
  candidateId,
  notes,
  loading,
  error,
  onRetry,
  onNoteAdded,
}: {
  candidateId: string; // the same ID as GET /records/:id
  notes: Note[];
  loading: boolean;
  error: string | null;
  onRetry: () => void; // GET /records/:id/notes again
  onNoteAdded: (note: Note) => void; // after a successful POST
}) {
  // Add Note opens the inline composer (text box + Cancel / Save Note)
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState(""); // the note being typed
  const openComposer = () => setComposerOpen(true);
  const closeComposer = () => {
    setComposerOpen(false);
    setDraft(""); // Cancel (or a successful save) clears the typed text
  };

  // "Note saved." banner, hidden again after a few seconds
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), SUCCESS_MESSAGE_MS);
    return () => clearTimeout(timer);
  }, [saved]);

  // POST /records/:id/notes. Throws on failure, so the composer can show the
  // error and keep the text.
  const saveNote = async (content: string) => {
    const note = await createNote({ id: candidateId, payload: { content } });
    onNoteAdded(note);
    closeComposer();
    setSaved(true);
  };

  const composer = composerOpen && (
    <NoteComposer
      value={draft}
      onChange={setDraft}
      onCancel={closeComposer}
      onSave={saveNote}
    />
  );

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
    // The composer replaces the empty state while the first note is typed
    return (
      composer || (
        <EmptyState
          title="No notes yet"
          description="Notes added after calls or interviews will appear here."
          actionLabel="Add Note"
          onAction={openComposer}
        />
      )
    );
  }

  return (
    <div className="space-y-4">
      {composer || (
        <div className="flex justify-end">
          <AddNoteButton onClick={openComposer} />
        </div>
      )}
      {saved && (
        <div className="*:mt-0">
          <SuccessMessage message="Note saved." />
        </div>
      )}
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
    </div>
  );
}

// Blue primary action, like Add candidate on the list page
function AddNoteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-4 font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="size-5"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
      Add Note
    </button>
  );
}

// Inline form for a new note: a text box with Cancel and Save Note.
// A blank note (empty or only spaces) shows an error instead of saving;
// the API also rejects it (NoteCreate: content minLength 1).
// While saving, the form is disabled so the note can't be sent twice.
// A failed save shows the error and keeps the text, so the user can retry.
function NoteComposer({
  value,
  onChange,
  onCancel,
  onSave,
}: {
  value: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  onSave: (content: string) => Promise<void>;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [error, setError] = useState<string | null>(null); // blank note
  const [saveError, setSaveError] = useState<string | null>(null); // failed POST
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault(); // no page reload
    if (saving) return; // already sending this note
    const content = value.trim();
    if (!content) {
      setError("Enter a note before saving.");
      textareaRef.current?.focus(); // back to the field that needs fixing
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      await onSave(content); // on success the composer closes
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Could not save the note.",
      );
      setSaving(false); // only on failure: on success this form is gone
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      // noValidate: our own message replaces the browser's pop-up bubble
      noValidate
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      {/* disabled while saving: no edits or second submit mid-request */}
      <fieldset disabled={saving}>
        <label htmlFor={id} className="text-sm text-slate-500">
          New note
          <span className="text-rose-600">
            <span aria-hidden="true"> *</span>
            <span className="sr-only"> (required)</span>
          </span>
        </label>
        <textarea
          ref={textareaRef}
          id={id}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            if (error) setError(null); // typing clears the message
          }}
          required
          // Screen readers hear "invalid" and the message with the field
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          rows={4}
          // Opened by Add Note, so the user can start typing straight away
          autoFocus
          placeholder="Add a note after a call or interview…"
          className={`mt-1 w-full resize-y rounded-lg border bg-white px-3 py-2 text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:outline-2 disabled:bg-slate-100 disabled:text-slate-500 ${
            error
              ? "border-rose-400 focus-visible:outline-rose-500"
              : "border-slate-200 focus-visible:outline-blue-500"
          }`}
        />
        {error && (
          <p id={errorId} className="mt-1 text-sm text-rose-600">
            {error}
          </p>
        )}

        {saveError && (
          <ErrorState title="Could not save the note" message={saveError} />
        )}
        <div className="mt-3 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 rounded-lg border border-slate-300 bg-white px-4 font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="h-10 rounded-lg bg-blue-600 px-4 font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Note"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
