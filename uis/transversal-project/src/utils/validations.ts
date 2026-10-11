import type { Claim, Clinician, ClinicianRole } from "../types/models";
import { isValidISODate } from "./helpers";

/**
 * -----Mental model — Big picture--------
 * Receive a claim, check each business rule independently, add an error message whenever a rule fails,
 * and return valid: true only when the errors array is empty.
 * Receive → Validate → Collect Errors → Determine Validity → Return
 */
export const validateClaim = (
  claim: Claim,
  knownLocationIds: string[],
  asOfDate: string,
): {
  valid: boolean;
  errors: string[];
} => {
  if (!isValidISODate(asOfDate))
    throw new Error("asOfDate must be a valid date in YYYY-MM-DD format");
  const errors: string[] = [];
  if (!knownLocationIds.includes(claim.locationId))
    errors.push("locationId must match one of the known clinic IDs");

  if (!Number.isFinite(claim.claimAmount) || claim.claimAmount <= 0)
    errors.push("claimAmount must be a finite number > 0");

  const isValidSubmissionDate = isValidISODate(claim.submissionDate);
  if (!isValidSubmissionDate || claim.submissionDate > asOfDate)
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
  allowedRoles: readonly ClinicianRole[],
  asOfDate: string,
): { valid: boolean; errors: string[] } => {
  if (!isValidISODate(asOfDate))
    throw new Error("asOfDate must be a valid date in YYYY-MM-DD format");
  const errors: string[] = [];
  if (
    !Number.isFinite(clinician.cmeHoursRequired) ||
    clinician.cmeHoursRequired < 0
  )
    errors.push("CME hours required must be finite and >= 0");

  if (
    !Number.isFinite(clinician.cmeHoursLogged) ||
    clinician.cmeHoursLogged < 0
  )
    errors.push("CME hours logged must be finite and >= 0");

  const isValidExpiryDate = isValidISODate(clinician.licenceExpiryDate);

  if (!isValidExpiryDate)
    errors.push("licenceExpiryDate must be a valid date in YYYY-MM-DD format");
  else if (clinician.licenceExpiryDate < asOfDate)
    errors.push("Licence is expired");

  if (!allowedRoles.includes(clinician.role))
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

export const isNoShowRateAboveThreshold = (
  rate: number,
  threshold: number = 20,
): boolean => {
  return rate > threshold;
};
