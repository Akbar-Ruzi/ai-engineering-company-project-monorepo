"use client";

import { useEffect, useId, useState } from "react";
import type { ReactNode } from "react";

import {
  DetailCard,
  EditButton,
} from "@/components/candidate-detail/detail-card";
import CandidateForm from "@/components/candidate-form/candidate-form";
import { useCandidateDrafts } from "@/context/candidate-drafts";
import ErrorState from "@/components/shared/error-state";
import SuccessMessage from "@/components/shared/success-message";
import { SUCCESS_MESSAGE_MS } from "@/lib/constants";
import {
  toCandidateFormValues,
  toUpdatePayload,
} from "@/lib/utils/candidate-form";
import {
  displayUrl,
  fileNameFromUrl,
  formatDate,
  formatDateTime,
  formatYears,
  textOrNull,
  webUrlOrNull,
} from "@/lib/utils/candidate-format";
import type {
  Candidate,
  CandidateFormValues,
  UpdateCandidatePayload,
} from "@/types/candidate";

// The candidate's contact and application details.
// Read-only until Edit, which swaps the details for the candidate form.
// Save sends PUT /records/:id with the full general information.
// The form's values are a draft in CandidateDraftsProvider, so an edit in
// progress survives Expand / Drawer View (the other view opens it as is).
export default function GeneralInformationCard({
  candidate,
  layout,
  onSave,
}: {
  candidate: Candidate;
  layout: "drawer" | "page";
  onSave: (payload: UpdateCandidatePayload) => Promise<void>; // PUT, via useCandidateDetail
}) {
  const { drafts, setDraft, clearDraft } = useCandidateDrafts();
  const draft = drafts[candidate.id]?.general;
  const editing = draft !== undefined; // a draft means the form is open
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const formId = useId();

  // Retry submits the form again, so it re-checks and sends the values that
  // are in the form now (the user may have fixed something after the error)
  const retry = () => {
    const form = document.getElementById(formId);
    if (form instanceof HTMLFormElement) form.requestSubmit();
  };

  // Hide the success message after a few seconds
  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), SUCCESS_MESSAGE_MS);
    return () => clearTimeout(timer);
  }, [saved]);

  const startEditing = () => {
    setError(null);
    setSaved(false); // no old "saved" message next to the open form
    setDraft(candidate.id, "general", toCandidateFormValues(candidate)); // start from the saved values
  };

  const cancel = () => {
    clearDraft(candidate.id, "general"); // throw the unsaved edits away
    setError(null);
  };

  // Called by the form only after its values pass validation
  const handleSubmit = async (values: CandidateFormValues) => {
    const payload = toUpdatePayload(values);

    // Nothing changed: close the form without a request (same as the
    // Recruitment progress card). Compares the cleaned values, so only
    // added spaces don't count as a change.
    const keys = Object.keys(payload) as (keyof UpdateCandidatePayload)[];
    if (keys.every((key) => payload[key] === candidate[key])) {
      clearDraft(candidate.id, "general");
      return;
    }

    setSaving(true); // disables the form while the request runs
    setError(null);
    try {
      await onSave(payload); // the hook sends it and shows the server's version
      clearDraft(candidate.id, "general"); // closes the form
      setSaved(true); // success: green message under the details, auto-hides
    } catch (err) {
      // The form stays open with the user's values, so they can fix and retry
      setError(
        err instanceof Error ? err.message : "Could not save the changes.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <DetailCard
      title="General information"
      action={
        editing ? null : (
          <EditButton label="Edit general information" onClick={startEditing} />
        )
      }
    >
      {editing ? (
        <CandidateForm
          id={formId}
          values={draft}
          onChange={(values) => setDraft(candidate.id, "general", values)}
          layout={layout}
          submitLabel="Save changes"
          saving={saving}
          onSubmit={handleSubmit}
          onCancel={cancel}
          feedback={
            error && (
              <ErrorState
                title="Could not save the changes"
                message={error}
                onRetry={retry}
              />
            )
          }
        />
      ) : (
        <>
          <CandidateDetails candidate={candidate} layout={layout} />
          {saved && (
            // Sticky bar in the same spot as the form's Cancel/Save buttons,
            // so the message shows where the user just clicked, not off-screen
            // at the bottom of the card. *:mt-0 drops SuccessMessage's margin.
            <div className="sticky bottom-0 -mx-5 -mb-5 mt-6 rounded-b-2xl border-t border-slate-100 bg-white px-5 py-4 *:mt-0 sm:-mx-6 sm:-mb-6 sm:px-6">
              <SuccessMessage message="General information saved." />
            </div>
          )}
        </>
      )}
    </DetailCard>
  );
}

// View mode: the details as text and links
function CandidateDetails({
  candidate,
  layout,
}: {
  candidate: Candidate;
  layout: "drawer" | "page";
}) {
  const isPage = layout === "page";

  // Optional or user-entered values: null means "show Not provided"
  const email = textOrNull(candidate.email);
  const phone = textOrNull(candidate.phone);
  const linkedinUrl = webUrlOrNull(candidate.linkedin_url);
  const cvUrl = webUrlOrNull(candidate.cv_url);
  const appliedAt = formatDate(candidate.applied_at);
  const updatedAt = formatDateTime(candidate.updated_at);

  return (
    <>
      <dl
        className={`grid grid-cols-1 gap-x-6 gap-y-5 ${
          isPage ? "md:grid-cols-3" : "sm:grid-cols-2"
        }`}
      >
        <Field label="Full Name">{candidate.full_name}</Field>
        <Field label="Position Applied For">{candidate.position}</Field>
        <Field label="Email Address">
          {email ? (
            <a href={`mailto:${email}`} className={LINK}>
              {email}
            </a>
          ) : (
            <Missing />
          )}
        </Field>
        <Field label="Phone">{phone ?? <Missing />}</Field>
        <Field label="Years of Experience">
          {formatYears(candidate.experience_years)}
        </Field>
        <Field label="Application Date">{appliedAt ?? <Missing />}</Field>
        <Field label="LinkedIn Profile">
          {linkedinUrl ? (
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${LINK} inline-flex items-center gap-1`}
            >
              {displayUrl(linkedinUrl)}
              <ExternalIcon />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          ) : (
            <Missing />
          )}
        </Field>
        <Field label="CV / Resume">
          {cvUrl ? (
            <a
              href={cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${LINK} inline-flex items-center gap-1`}
            >
              <FileIcon />
              {fileNameFromUrl(cvUrl)}
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          ) : (
            <Missing />
          )}
        </Field>
        {/* Page: one more grid item. Drawer: a footer row (below). */}
        {isPage && (
          <Field label="Last Updated">{updatedAt ?? <Missing />}</Field>
        )}
      </dl>

      {!isPage && (
        <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-100 pt-4 text-sm">
          <span className="text-slate-500">Last Updated</span>
          <span className="text-slate-700">{updatedAt ?? <Missing />}</span>
        </div>
      )}
    </>
  );
}

const LINK =
  "break-all text-blue-600 hover:text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-blue-500";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="mt-1 text-slate-900">{children}</dd>
    </div>
  );
}

function Missing() {
  return <span className="text-slate-400">Not provided</span>;
}

function ExternalIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4 shrink-0"
    >
      <path d="M11 4h5v5M16 4l-7 7M14 12v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinejoin="round"
      className="size-4 shrink-0"
    >
      <path d="M5 3h6l4 4v10H5V3z" />
      <path d="M11 3v4h4" />
    </svg>
  );
}
