"use client";

import { useEffect, useState } from "react";

import {
  DetailCard,
  EditButton,
} from "@/components/candidate-detail/detail-card";
import { StageBadge, StatusBadge } from "@/components/shared/candidate-badges";
import ErrorState from "@/components/shared/error-state";
import { useCandidateDrafts } from "@/context/candidate-drafts";
import SuccessMessage from "@/components/shared/success-message";
import {
  STAGE_LABELS,
  STATUS_LABELS,
  SUCCESS_MESSAGE_MS,
} from "@/lib/constants";
import type {
  Candidate,
  CandidateStage,
  CandidateStatus,
  UpdateCandidateStatusPayload,
} from "@/types/candidate";

// Current status and stage. Read-only until the user clicks Edit, so a
// misclick can't change a hiring decision. Save sends PATCH /records/:id
// with only the fields that changed. The choices while editing are a draft in
// CandidateDraftsProvider, so they survive Expand / Drawer View.
export default function RecruitmentProgressCard({
  candidate,
  layout,
  onSave,
}: {
  candidate: Candidate;
  layout: "drawer" | "page";
  onSave: (payload: UpdateCandidateStatusPayload) => Promise<void>; // PATCH, via useCandidateDetail
}) {
  const isPage = layout === "page";

  // The user's choices while editing; the candidate only changes after Save
  const { drafts, setDraft, clearDraft } = useCandidateDrafts();
  const draft = drafts[candidate.id]?.progress;
  const editing = draft !== undefined; // a draft means the form is open
  const status = draft?.status ?? candidate.status;
  const stage = draft?.stage ?? candidate.stage;
  const setStatus = (next: CandidateStatus) =>
    setDraft(candidate.id, "progress", { status: next, stage });
  const setStage = (next: CandidateStage) =>
    setDraft(candidate.id, "progress", { status, stage: next });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Hide the success message after a few seconds
  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), SUCCESS_MESSAGE_MS);
    return () => clearTimeout(timer);
  }, [saved]);

  const startEditing = () => {
    setError(null);
    setSaved(false);
    setDraft(candidate.id, "progress", {
      status: candidate.status, // start from the saved values
      stage: candidate.stage,
    });
  };

  const cancel = () => {
    clearDraft(candidate.id, "progress");
    setError(null);
  };

  const save = async () => {
    // Minimal PATCH body: only what actually changed
    const payload: UpdateCandidateStatusPayload = {};
    if (status !== candidate.status) payload.status = status;
    if (stage !== candidate.stage) payload.stage = stage;

    if (Object.keys(payload).length === 0) {
      clearDraft(candidate.id, "progress"); // nothing changed: no request
      return;
    }

    setSaving(true); // disables the controls, so it can't be sent twice
    setError(null);
    try {
      await onSave(payload); // the hook sends it and shows the server's version
      clearDraft(candidate.id, "progress"); // closes the form
      setSaved(true);
    } catch (err) {
      // Stay in edit mode with the user's choices, so they can retry
      setError(
        err instanceof Error ? err.message : "Could not save the changes.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <DetailCard
      title="Recruitment progress"
      action={
        editing ? null : (
          <EditButton
            label="Edit recruitment progress"
            onClick={startEditing}
          />
        )
      }
    >
      {editing ? (
        <form
          onSubmit={(event) => {
            event.preventDefault(); // stay on the page; save with fetch
            save();
          }}
        >
          <fieldset
            disabled={saving}
            className={isPage ? "grid gap-4 md:grid-cols-2" : "space-y-4"}
          >
            <SelectField
              id={`${layout}-status`}
              label="Current status"
              value={status}
              options={STATUS_LABELS}
              onChange={setStatus}
            />
            <SelectField
              id={`${layout}-stage`}
              label="Current stage"
              value={stage}
              options={STAGE_LABELS}
              onChange={setStage}
            />
          </fieldset>

          {error && (
            <ErrorState
              title="Could not save the changes"
              message={error}
              onRetry={save}
            />
          )}

          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={cancel}
              disabled={saving}
              className="h-10 rounded-lg border border-slate-300 bg-white px-4 font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-10 rounded-lg bg-blue-600 px-4 font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      ) : (
        <>
          <dl className={isPage ? "grid gap-4 md:grid-cols-2" : "space-y-4"}>
            <div>
              <dt className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">
                Current status
              </dt>
              <dd>
                <StatusBadge status={candidate.status} />
              </dd>
            </div>
            <div>
              <dt className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">
                Current stage
              </dt>
              <dd>
                <StageBadge stage={candidate.stage} />
              </dd>
            </div>
          </dl>

          {saved && <SuccessMessage message="Recruitment progress saved." />}
        </>
      )}
    </DetailCard>
  );
}

// A labelled dropdown. Shows UI labels; the value is the raw API value.
function SelectField<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: T;
  options: Record<T, string>;
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold uppercase tracking-wide text-slate-600"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        // Safe: the only options are the keys of `options`
        onChange={(event) => onChange(event.target.value as T)}
        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 shadow-sm focus-visible:outline-2 focus-visible:outline-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
      >
        {(Object.entries(options) as [T, string][]).map(
          ([optionValue, text]) => (
            <option key={optionValue} value={optionValue}>
              {text}
            </option>
          ),
        )}
      </select>
    </div>
  );
}
