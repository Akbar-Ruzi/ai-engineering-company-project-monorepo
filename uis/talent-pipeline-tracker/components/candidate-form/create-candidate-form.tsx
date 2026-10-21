"use client";

import { useEffect, useEffectEvent, useId, useState } from "react";

import CandidateForm from "@/components/candidate-form/candidate-form";
import ErrorState from "@/components/shared/error-state";
import SuccessMessage from "@/components/shared/success-message";
import { useCandidateDrafts } from "@/context/candidate-drafts";
import { useCreateCandidate } from "@/hooks/useCreateCandidate";
import { NEW_CANDIDATE_ID, SUCCESS_MESSAGE_MS } from "@/lib/constants";
import {
  EMPTY_CANDIDATE_FORM,
  toCreatePayload,
} from "@/lib/utils/candidate-form";
import type { Candidate, CandidateFormValues } from "@/types/candidate";

// New-candidate form, shared by the create drawer and the create full page.
// Create sends POST /records. The values are a draft under NEW_CANDIDATE_ID,
// so typing survives Expand / Drawer View; Cancel and Close discard them.
// After a successful save, the form stays blurred under "Candidate created."
// for a few seconds, then onCreated opens the new candidate's details.
export default function CreateCandidateForm({
  layout,
  onCreated,
  onCancel,
}: {
  layout: "drawer" | "page";
  onCreated: (candidate: Candidate) => void; // e.g. open the new candidate
  onCancel: () => void;
}) {
  const { createCandidate } = useCreateCandidate();
  const { drafts, setDraft, clearDraft } = useCandidateDrafts();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The saved candidate and the values that were sent, while the success
  // message shows (the draft is already cleared, so the form keeps these)
  const [created, setCreated] = useState<{
    candidate: Candidate;
    values: CandidateFormValues;
  } | null>(null);
  const values =
    created?.values ?? drafts[NEW_CANDIDATE_ID]?.general ?? EMPTY_CANDIDATE_FORM;
  const formId = useId();

  // Retry submits the form again, so it re-checks and sends the values that
  // are in the form now (the user may have fixed something after the error)
  const retry = () => {
    const form = document.getElementById(formId);
    if (form instanceof HTMLFormElement) form.requestSubmit();
  };

  // When the message's time is up, open the new candidate's details.
  // Closing the drawer first unmounts this form, and the cleanup cancels it.
  // An Effect Event: the parents pass a new onCreated on every render, which
  // must not restart the timer.
  const openCreated = useEffectEvent((candidate: Candidate) =>
    onCreated(candidate),
  );
  useEffect(() => {
    if (!created) return;
    const timer = setTimeout(
      () => openCreated(created.candidate),
      SUCCESS_MESSAGE_MS,
    );
    return () => {
      clearTimeout(timer);
      // cacheComponents keeps a page we left alive but hidden (<Activity>),
      // with its state. Reset here, so a form shown again (e.g. Expand to
      // /candidates/new later) starts empty, not on the old success message.
      setCreated(null);
      setSaving(false);
    };
  }, [created]);

  // Called by the form only after its values pass validation
  const handleSubmit = async (submitted: CandidateFormValues) => {
    if (saving) return; // already sending this candidate
    setSaving(true); // disables the form, so it can't be sent twice
    setError(null);
    try {
      const candidate = await createCandidate(toCreatePayload(submitted));
      clearDraft(NEW_CANDIDATE_ID, "general"); // the next Add starts empty
      // saving stays true: the form remains disabled under the message
      setCreated({ candidate, values: submitted });
    } catch (err) {
      // The form stays open with the user's values, so they can fix and retry
      setError(
        err instanceof Error ? err.message : "Could not create the candidate.",
      );
      setSaving(false); // only on failure: on success the form is left
    }
  };

  return (
    <section className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      {/* inert while the message shows: no clicks or Tab into the old form */}
      <div inert={created !== null}>
        <CandidateForm
          id={formId}
          values={values}
          onChange={(next) => setDraft(NEW_CANDIDATE_ID, "general", next)}
          layout={layout}
          submitLabel="Create Candidate"
          saving={saving}
          onSubmit={handleSubmit}
          onCancel={onCancel}
          feedback={
            error && (
              <ErrorState
                title="Could not create the candidate"
                message={error}
                onRetry={retry}
              />
            )
          }
        />
      </div>

      {created && (
        // Blurs the saved form; *:mt-0 drops SuccessMessage's own top margin
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/60 p-5 backdrop-blur-sm *:mt-0">
          <SuccessMessage message="Candidate created successfully." />
        </div>
      )}
    </section>
  );
}
