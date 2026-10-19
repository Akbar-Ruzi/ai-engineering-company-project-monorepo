"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import {
  DetailCard,
  EditButton,
} from "@/components/candidate-detail/detail-card";
import CandidateForm from "@/components/candidate-form/candidate-form";
import { toCandidateFormValues } from "@/lib/utils/candidate-form";
import {
  displayUrl,
  fileNameFromUrl,
  formatDate,
  formatDateTime,
  formatYears,
  textOrNull,
  webUrlOrNull,
} from "@/lib/utils/candidate-format";
import type { Candidate, CandidateFormValues } from "@/types/candidate";

// The candidate's contact and application details.
// Read-only until Edit, which swaps the details for the candidate form.
export default function GeneralInformationCard({
  candidate,
  layout,
}: {
  candidate: Candidate;
  layout: "drawer" | "page";
}) {
  const [editing, setEditing] = useState(false);

  // Save is wired to PUT /records/:id next (validation + save subtasks)
  const handleSubmit = (values: CandidateFormValues) => {
    void values;
  };

  return (
    <DetailCard
      title="General information"
      action={
        editing ? null : (
          <EditButton
            label="Edit general information"
            onClick={() => setEditing(true)}
          />
        )
      }
    >
      {editing ? (
        <CandidateForm
          // Filled in from the saved candidate each time Edit is opened
          initialValues={toCandidateFormValues(candidate)}
          layout={layout}
          submitLabel="Save changes"
          saving={false}
          onSubmit={handleSubmit}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <CandidateDetails candidate={candidate} layout={layout} />
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
