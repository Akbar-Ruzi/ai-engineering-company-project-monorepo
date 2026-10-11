import type { Claim, Clinician } from "../types/models";
import { isValidISODate } from "./helpers";
import { sampleAllowedRoles } from "../data/sampleData";

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
  const isValidSubmissionDate = isValidISODate(claim.submissionDate);
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

/**
 * ---- Mental model — Big picture -------
 * Receive a clinician, check their CME hours, verify their licence expiry date,
 * validate their role, collect an error message for every failed rule,
 * and return whether the clinician is valid.
 */
export const validateClinician = (
  clinician: Clinician,
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (!(clinician.cmeHoursRequired >= 0))
    errors.push("CME hours required cannot be negative");

  if (!(clinician.cmeHoursLogged >= 0))
    errors.push("CME hours logged cannot be negative");

  const isValidExpiryDate = isValidISODate(clinician.licenceExpiryDate);

  const today = new Date();
  const todayDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  if (!isValidExpiryDate)
    errors.push("licenceExpiryDate must be a valid date in YYYY-MM-DD format");
  else if (clinician.licenceExpiryDate < todayDate)
    errors.push("Licence is expired");

  if (!sampleAllowedRoles.includes(clinician.role))
    errors.push("role must be one of the four defined values");

  return {
    valid: errors.length === 0,
    errors,
  };
};
/**
 * --------Mental model-------------
 * Receive Rate → Compare Threshold → Return Boolean
 */

export function isDenialRateAboveThreshold(
  rate: number,
  threshold: number = 8,
): boolean {
  return rate > threshold;
}
