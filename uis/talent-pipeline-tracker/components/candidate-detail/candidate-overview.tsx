import type { ReactNode } from "react";

import { STAGE_LABELS, STATUS_LABELS } from "@/lib/constants";
import {
  displayUrl,
  fileNameFromUrl,
  formatDate,
  formatDateTime,
  formatYears,
  textOrNull,
  webUrlOrNull,
} from "@/lib/utils/candidate-format";
import type { Candidate } from "@/types/candidate";

// Overview tab body, shared by the drawer and the full page.
// "drawer" is the narrow side panel; "page" is the wide expanded view.
export default function CandidateOverview({
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
    <div className="space-y-5">
      <Card title="Recruitment progress">
        {/* Not saved yet: PATCH /records/:id comes next */}
        <div className={isPage ? "grid gap-4 md:grid-cols-2" : "space-y-4"}>
          <SelectField
            id={`${layout}-status`}
            label="Current status"
            defaultValue={candidate.status}
            options={STATUS_LABELS}
          />
          <SelectField
            id={`${layout}-stage`}
            label="Current stage"
            defaultValue={candidate.stage}
            options={STAGE_LABELS}
          />
        </div>
      </Card>

      <Card
        title="General information"
        action={
          // Opens the edit form once it is built
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-500"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
            >
              <path d="M13.5 3.5l3 3L7 16H4v-3l9.5-9.5z" />
            </svg>
            Edit
          </button>
        }
      >
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
      </Card>
    </div>
  );
}

const LINK =
  "break-all text-blue-600 hover:text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-blue-500";

function Card({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function SelectField<T extends string>({
  id,
  label,
  defaultValue,
  options,
}: {
  id: string;
  label: string;
  defaultValue: T;
  options: Record<T, string>;
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
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 shadow-sm focus-visible:outline-2 focus-visible:outline-blue-500"
      >
        {(Object.entries(options) as [T, string][]).map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </div>
  );
}

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
