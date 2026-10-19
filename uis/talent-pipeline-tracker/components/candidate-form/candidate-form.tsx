"use client";

import { useId, useState } from "react";
import type { HTMLInputTypeAttribute, ReactNode } from "react";

import { MAX_EXPERIENCE_YEARS } from "@/lib/constants";
import { validateCandidateForm } from "@/lib/utils/candidate-form";
import type {
  CandidateFormErrors,
  CandidateFormValues,
} from "@/types/candidate";

type FieldName = keyof CandidateFormValues;

// The seven fields, in display order. Labels match the General information card.
const FIELDS: {
  name: FieldName;
  label: string;
  type: HTMLInputTypeAttribute;
  required: boolean;
  autoComplete: string;
  placeholder?: string;
}[] = [
  {
    name: "full_name",
    label: "Full Name",
    type: "text",
    required: true,
    autoComplete: "name",
  },
  {
    name: "position",
    label: "Position Applied For",
    type: "text",
    required: true,
    autoComplete: "organization-title",
  },
  {
    name: "email",
    label: "Email Address",
    type: "email",
    required: true,
    autoComplete: "email",
    placeholder: "name@example.com",
  },
  {
    name: "phone",
    label: "Phone",
    type: "tel",
    required: true,
    autoComplete: "tel",
    placeholder: "+1 555 0192",
  },
  {
    name: "experience_years",
    label: "Years of Experience",
    type: "number",
    required: true,
    autoComplete: "off",
  },
  {
    name: "linkedin_url",
    label: "LinkedIn Profile",
    type: "url",
    required: false,
    autoComplete: "url",
    placeholder: "https://linkedin.com/in/…",
  },
  {
    name: "cv_url",
    label: "CV / Resume URL",
    type: "url",
    required: false,
    autoComplete: "url",
    placeholder: "https://…/cv.pdf",
  },
];

// Reusable candidate form: edit (step 5, filled in) and create (step 7, empty).
// It keeps what the user types in its own state, so the values survive a
// failed save. It checks the values first and only calls onSubmit when they
// are valid; the parent decides what Save does (PUT or POST).
export default function CandidateForm({
  initialValues,
  layout,
  submitLabel,
  saving,
  onSubmit,
  onCancel,
  feedback,
}: {
  initialValues: CandidateFormValues;
  layout: "drawer" | "page";
  submitLabel: string; // e.g. "Save changes" or "Add candidate"
  saving: boolean; // disables the form while the request runs
  onSubmit: (values: CandidateFormValues) => void;
  onCancel: () => void;
  feedback?: ReactNode; // e.g. an ErrorState after a failed save
}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<CandidateFormErrors>({});
  const idPrefix = useId(); // unique ids, so each label points at its own input
  const inputId = (name: FieldName) => `${idPrefix}-${name}`;

  const setField = (name: FieldName, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
    // Editing a field clears its message; the rest stay until the next Save
    setErrors((current) => {
      if (!current[name]) return current; // no message: nothing to change
      const next = { ...current };
      delete next[name];
      return next;
    });
  };

  const handleSubmit = () => {
    const found = validateCandidateForm(values);
    setErrors(found);

    // Invalid: send nothing, and move focus to the first field to fix
    const firstInvalid = FIELDS.find((field) => found[field.name]);
    if (firstInvalid) {
      document.getElementById(inputId(firstInvalid.name))?.focus();
      return;
    }
    onSubmit(values);
  };

  return (
    <form
      // noValidate: our own messages replace the browser's pop-up bubbles
      noValidate
      onSubmit={(event) => {
        event.preventDefault(); // stay on the page; the parent saves with fetch
        handleSubmit();
      }}
    >
      {/* disabled on a fieldset disables every input inside it */}
      <fieldset
        disabled={saving}
        className={`grid grid-cols-1 gap-x-6 gap-y-5 ${
          layout === "page" ? "md:grid-cols-3" : "sm:grid-cols-2"
        }`}
      >
        {FIELDS.map((field) => {
          const id = inputId(field.name);
          const error = errors[field.name];
          const errorId = `${id}-error`;
          return (
            <div key={field.name} className="min-w-0">
              <label htmlFor={id} className="text-sm text-slate-500">
                {field.label}
                {field.required && (
                  <span className="text-rose-600">
                    <span aria-hidden="true"> *</span>
                    <span className="sr-only"> (required)</span>
                  </span>
                )}
              </label>
              <input
                id={id}
                name={field.name}
                type={field.type}
                required={field.required}
                autoComplete={field.autoComplete}
                placeholder={field.placeholder}
                value={values[field.name]}
                onChange={(event) => setField(field.name, event.target.value)}
                {...(field.type === "number" && {
                  min: 0,
                  max: MAX_EXPERIENCE_YEARS,
                  step: "any",
                })}
                // Screen readers hear "invalid" and the message with the field
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:outline-2 disabled:bg-slate-100 disabled:text-slate-500 ${
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
            </div>
          );
        })}
      </fieldset>

      {/* Sticky: on a long form or a small screen, the buttons stay in reach.
          The feedback sits in the same bar, so a failed save is never hidden
          below the fold or behind the buttons. */}
      <div className="sticky bottom-0 -mx-5 -mb-5 mt-6 space-y-4 rounded-b-2xl border-t border-slate-100 bg-white px-5 py-4 sm:-mx-6 sm:-mb-6 sm:px-6">
        {/* *:mt-0 removes ErrorState's own top margin inside the bar */}
        {feedback && <div className="*:mt-0">{feedback}</div>}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
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
            {saving ? "Saving…" : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
