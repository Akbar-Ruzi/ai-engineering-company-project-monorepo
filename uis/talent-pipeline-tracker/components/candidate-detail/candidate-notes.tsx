import { useEffect, useId, useRef, useState } from "react";
import type { SubmitEvent } from "react";

import EmptyState from "@/components/shared/empty-state";
import ErrorState from "@/components/shared/error-state";
import SuccessMessage from "@/components/shared/success-message";
import { SUCCESS_MESSAGE_MS } from "@/lib/constants";
import { formatNoteDate } from "@/lib/utils/candidate-format";
import type { Note } from "@/types/note";

// The one unfinished action in the Notes tab. A single value (not a flag per
// form) means a new note and a delete confirmation, or two confirmations,
// can never be open at the same time.
type PendingAction =
  | { type: "none" }
  | { type: "adding" } // the composer is open
  | { type: "deleting"; noteId: string }; // this note's confirmation is open

const NO_ACTION: PendingAction = { type: "none" };

// Notes tab body, shared by the drawer and the full page.
// The parent loads the notes (useCandidateNotes), so switching tabs
// doesn't refetch them.
export default function CandidateNotes({
  notes,
  loading,
  error,
  onRetry,
  onSave,
  onDelete,
}: {
  notes: Note[];
  loading: boolean;
  error: string | null;
  onRetry: () => void; // GET /records/:id/notes again
  onSave: (content: string) => Promise<void>; // POST + add to the list
  onDelete: (note: Note) => Promise<void>; // DELETE + remove from the list
}) {
  const [pending, setPending] = useState<PendingAction>(NO_ACTION);
  const composerOpen = pending.type === "adding";

  // Add Note opens the inline composer (text box + Cancel / Save Note),
  // closing any open delete confirmation
  const [draft, setDraft] = useState(""); // the note being typed
  const openComposer = () => setPending({ type: "adding" });
  const closeComposer = () => {
    setPending(NO_ACTION);
    setDraft(""); // Cancel (or a successful save) clears the typed text
  };

  // "Note saved." / "Note deleted." banner, hidden again after a few seconds.
  // A new object each time, so a second delete restarts the timer.
  const [success, setSuccess] = useState<{ text: string } | null>(null);
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), SUCCESS_MESSAGE_MS);
    return () => clearTimeout(timer);
  }, [success]);

  // After a delete the focused card is gone; focus moves to the heading
  // (tabIndex -1: focusable from code, not a Tab stop) instead of the page top
  const headingRef = useRef<HTMLHeadingElement>(null);

  // What the Notes tab does after the hook's request succeeds. A failure
  // throws past these lines, so the composer / confirmation shows the error.
  const handleSave = async (content: string) => {
    await onSave(content);
    closeComposer();
    setSuccess({ text: "Note saved." });
  };

  const handleDelete = async (note: Note) => {
    await onDelete(note);
    setPending(NO_ACTION); // the confirmation is gone with the card
    setSuccess({ text: "Note deleted." });
    headingRef.current?.focus();
  };

  const composer = composerOpen && (
    <NoteComposer
      value={draft}
      onChange={setDraft}
      onCancel={closeComposer}
      onSave={handleSave}
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

  const isEmpty = notes.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h3
          ref={headingRef}
          tabIndex={-1}
          className="text-lg font-semibold text-slate-900 focus:outline-none"
        >
          Internal Notes
        </h3>
        {/* Hidden while the composer is open (one new note at a time) and
            when empty (the empty state has its own Add Note) */}
        {!composerOpen && !isEmpty && <AddNoteButton onClick={openComposer} />}
      </div>
      {success && (
        <div className="*:mt-0">
          <SuccessMessage message={success.text} />
        </div>
      )}
      {composer}
      {/* No notes: the composer replaces the empty state while typing */}
      {isEmpty && !composerOpen && (
        <div className="*:mt-0">
          <EmptyState
            title="No notes yet"
            description="Notes added after calls or interviews will appear here."
            actionLabel="Add Note"
            onAction={openComposer}
          />
        </div>
      )}
      <ul className="space-y-3">
        {notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            confirming={
              pending.type === "deleting" && pending.noteId === note.id
            }
            // While a new note is being typed, no deletes: finish that first
            canDelete={!composerOpen}
            // Opening one confirmation closes any other
            onDeleteStart={() =>
              setPending({ type: "deleting", noteId: note.id })
            }
            onDeleteCancel={() => setPending(NO_ACTION)}
            onDeleteConfirm={() => handleDelete(note)}
          />
        ))}
      </ul>
    </div>
  );
}

// One note: text, then a footer with the date and a trash button.
// The trash button swaps the card's content for an inline confirmation
// (Cancel / Delete Note), so nothing is deleted by a single click.
// The parent decides which card (if any) is confirming.
function NoteCard({
  note,
  confirming,
  canDelete,
  onDeleteStart,
  onDeleteCancel,
  onDeleteConfirm,
}: {
  note: Note;
  confirming: boolean;
  canDelete: boolean; // false while the composer is open
  onDeleteStart: () => void;
  onDeleteCancel: () => void;
  onDeleteConfirm: () => Promise<void>; // runs the DELETE request
}) {
  // The API has no author field, so a note shows its text and date only
  const createdAt = formatNoteDate(note.created_at);
  const questionId = useId();

  // Focus: Cancel when the confirmation opens; the trash button again after
  // Cancel, so keyboard users stay on this note instead of the page top
  const trashRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);
  useEffect(() => {
    if (!confirming && returnFocus.current) {
      returnFocus.current = false;
      trashRef.current?.focus();
    }
  }, [confirming]);

  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const startDelete = () => {
    setDeleteError(null); // a fresh confirmation, without an old error
    onDeleteStart();
  };

  const cancel = () => {
    returnFocus.current = true;
    onDeleteCancel();
  };

  // On success the parent removes this card; on failure the note stays and
  // the confirmation shows the error, so Delete Note can be tried again
  const confirmDelete = async () => {
    if (deleting) return; // already sending this DELETE
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDeleteConfirm();
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Could not delete the note.",
      );
      setDeleting(false); // only on failure: on success this card is gone
    }
  };

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      {confirming ? (
        <div
          role="group"
          aria-labelledby={questionId}
          className="flex flex-col items-center text-center"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <TrashIcon className="size-5" />
          </span>
          <p id={questionId} className="mt-3 font-semibold text-slate-900">
            Are you sure you want to delete this note?
          </p>
          <p className="mt-1 text-sm text-slate-500">
            This action cannot be undone.
          </p>
          {deleteError && (
            <div className="w-full text-left *:mt-4">
              <ErrorState
                title="Could not delete the note"
                message={deleteError}
              />
            </div>
          )}
          <div className="mt-4 grid w-full grid-cols-2 gap-3">
            <button
              type="button"
              onClick={cancel}
              disabled={deleting}
              // Opened by the trash button: start on the safe choice
              autoFocus
              className="h-10 rounded-lg border border-slate-300 bg-white px-4 font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              // disabled while deleting, so it can't be sent twice
              disabled={deleting}
              className="h-10 rounded-lg bg-rose-700 px-4 font-semibold text-white hover:bg-rose-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:opacity-60"
            >
              {deleting ? "Deleting…" : "Delete Note"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* pre-wrap keeps the line breaks typed into the note */}
          <p className="whitespace-pre-wrap break-words leading-relaxed text-slate-600">
            {note.content}
          </p>
          {/* Footer under a divider: date on the left, delete on the right */}
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
            {createdAt ? (
              <time
                dateTime={note.created_at}
                className="text-sm text-slate-400"
              >
                {createdAt}
              </time>
            ) : (
              <span /> // keeps the trash icon on the right
            )}
            {canDelete && (
              <button
                ref={trashRef}
                type="button"
                onClick={startDelete}
                // The icon has no text, so the name (with the date) says which note
                aria-label={
                  createdAt ? `Delete note from ${createdAt}` : "Delete note"
                }
                title="Delete note"
                className="-m-1.5 shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                <TrashIcon className="size-4" />
              </button>
            )}
          </div>
        </>
      )}
    </li>
  );
}

function TrashIcon({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
    </svg>
  );
}

// Blue primary action, like Add candidate on the list page
function AddNoteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-blue-600 px-3.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="size-4"
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
