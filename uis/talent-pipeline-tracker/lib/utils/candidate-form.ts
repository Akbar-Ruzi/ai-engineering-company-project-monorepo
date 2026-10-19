// Converts between a Candidate and the candidate form's input values.

import type { Candidate, CandidateFormValues } from "@/types/candidate";

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
