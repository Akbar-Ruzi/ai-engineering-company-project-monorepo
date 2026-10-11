import type { Claim } from "../types/models";

/**
 * -----Mental model — Big picture--------
 * Receive a claim, check each business rule independently, add an error message whenever a rule fails,
 * and return valid: true only when the errors array is empty.
 * Receive → Validate → Collect Errors → Determine Validity → Return
 */
export const validateClaim = (
  claim: Claim,
  knownLocationIds: string[],
): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  if (!knownLocationIds.includes(claim.locationId))
    errors.push("locationId must match one of the known clinic IDs");

  if (!(claim.claimAmount > 0)) errors.push("claimAmount must be > 0");

  const submissionDate = new Date(claim.submissionDate).getTime();
  const isValidSubmissionDate =
    /^\d{4}-\d{2}-\d{2}$/.test(claim.submissionDate) &&
    !Number.isNaN(submissionDate) &&
    new Date(submissionDate).toISOString().slice(0, 10) ===
      claim.submissionDate;
  if (!isValidSubmissionDate || submissionDate > Date.now())
    errors.push(
      "submissionDate must be a valid date in YYYY-MM-DD format and not a future date",
    );

  if (claim.status === "denied" && !claim.denialReason)
    errors.push("denialReason must be present");

  if (!/^HC-[A-Za-z0-9]{6}$/.test(claim.patientId))
    errors.push(
      "must match the format HC- followed by 6 alphanumeric characters",
    );
  return {
    valid: errors.length === 0,
    errors,
  };
};
