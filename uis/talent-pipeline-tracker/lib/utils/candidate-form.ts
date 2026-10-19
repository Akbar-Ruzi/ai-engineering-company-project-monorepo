// Converts between a Candidate and the candidate form's input values,
// and checks the values before they are sent.

import { webUrlOrNull } from "@/lib/utils/candidate-format";
import type {
  Candidate,
  CandidateFormErrors,
  CandidateFormValues,
} from "@/types/candidate";

// Something@something.something, no spaces. A light check: the API does the strict one.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  if (!values.phone.trim()) {
    errors.phone = "Enter a phone number.";
  }

  const years = values.experience_years.trim();
  if (!years) {
    errors.experience_years = "Enter the years of experience.";
  } else if (!Number.isFinite(Number(years)) || Number(years) < 0) {
    errors.experience_years = "Enter a number of years, 0 or more.";
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
