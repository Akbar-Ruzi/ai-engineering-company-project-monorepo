// Converts between a Candidate and the candidate form's input values,
// and checks the values before they are sent.

import { MAX_EXPERIENCE_YEARS } from "@/lib/constants";
import { textOrNull, webUrlOrNull } from "@/lib/utils/candidate-format";
import type {
  Candidate,
  CandidateFormErrors,
  CandidateFormValues,
  CreateCandidatePayload,
  UpdateCandidatePayload,
} from "@/types/candidate";

// Something@something.something, no spaces. A light check: the API does the strict one.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Digits with common separators (spaces, dashes, dots, brackets) and an
// optional leading +, e.g. "+1 (555) 019-2034". Our own rule: the API takes any text.
const PHONE_PATTERN = /^\+?[\d\s().-]+$/;
// International numbers have at most 15 digits (E.164); fewer than 7 is
// too short for a real number
const MIN_PHONE_DIGITS = 7;
const MAX_PHONE_DIGITS = 15;

// Editing: start from the candidate's saved information (null URLs → empty inputs)
export function toCandidateFormValues(
  candidate: Candidate,
): CandidateFormValues {
  return {
    full_name: candidate.full_name,
    email: candidate.email,
    phone: candidate.phone,
    position: candidate.position,
    linkedin_url: candidate.linkedin_url ?? "",
    cv_url: candidate.cv_url ?? "",
    experience_years: String(candidate.experience_years),
  };
}

// Creating: every input starts empty
export const EMPTY_CANDIDATE_FORM: CandidateFormValues = {
  full_name: "",
  email: "",
  phone: "",
  position: "",
  linkedin_url: "",
  cv_url: "",
  experience_years: "",
};

// Checks the form against the API rules (backend schema RecordCreate):
// full_name, email, phone, position, and experience_years are required;
// linkedin_url and cv_url are optional, but must be http(s) URLs when filled in.
// Returns an empty object when everything is valid.
export function validateCandidateForm(
  values: CandidateFormValues,
): CandidateFormErrors {
  const errors: CandidateFormErrors = {};

  if (!values.full_name.trim()) {
    errors.full_name = "Enter the candidate's full name.";
  }
  if (!values.position.trim()) {
    errors.position = "Enter the position applied for.";
  }

  const email = values.email.trim();
  if (!email) {
    errors.email = "Enter an email address.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address, like name@example.com.";
  }

  const phone = values.phone.trim();
  const phoneDigits = phone.replace(/\D/g, "").length; // separators don't count
  if (!phone) {
    errors.phone = "Enter a phone number.";
  } else if (
    !PHONE_PATTERN.test(phone) ||
    phoneDigits < MIN_PHONE_DIGITS ||
    phoneDigits > MAX_PHONE_DIGITS
  ) {
    errors.phone = `Enter a valid phone number (${MIN_PHONE_DIGITS}–${MAX_PHONE_DIGITS} digits), like +1 555 0192.`;
  }

  const years = values.experience_years.trim();
  if (!years) {
    errors.experience_years = "Enter the years of experience.";
  } else if (
    !Number.isFinite(Number(years)) ||
    Number(years) < 0 ||
    Number(years) > MAX_EXPERIENCE_YEARS // our limit; the API has none
  ) {
    errors.experience_years = `Enter a number of years between 0 and ${MAX_EXPERIENCE_YEARS}.`;
  }

  // Same rule the details view uses to show a link, so a saved URL always works
  if (values.linkedin_url.trim() && !webUrlOrNull(values.linkedin_url)) {
    errors.linkedin_url = "Enter a full URL starting with https://";
  }
  if (values.cv_url.trim() && !webUrlOrNull(values.cv_url)) {
    errors.cv_url = "Enter a full URL starting with https://";
  }

  return errors;
}

// Saving: the form's input values → the PUT /records/:id body.
// Call after validateCandidateForm passes, so experience_years is a valid number.
export function toUpdatePayload(
  values: CandidateFormValues,
): UpdateCandidatePayload {
  return {
    full_name: values.full_name.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    position: values.position.trim(),
    linkedin_url: textOrNull(values.linkedin_url), // empty input → null, as the API stores it
    cv_url: textOrNull(values.cv_url),
    experience_years: Number(values.experience_years.trim()),
  };
}

// Saving a new candidate: the form's input values → the POST /records body.
// Same cleaning as toUpdatePayload, but an empty URL is left out (not null):
// there is no old link to clear.
export function toCreatePayload(
  values: CandidateFormValues,
): CreateCandidatePayload {
  const { linkedin_url, cv_url, ...required } = toUpdatePayload(values);
  return {
    ...required,
    ...(linkedin_url && { linkedin_url }),
    ...(cv_url && { cv_url }),
  };
}
