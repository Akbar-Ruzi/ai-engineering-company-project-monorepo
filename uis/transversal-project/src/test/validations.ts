import {
  sampleClaims,
  sampleClinicians,
  sampleLocations,
} from "../data/sampleData";
import { validateClaim, validateClinician } from "../utils/validations";
import { showResult, type TestOutput } from "./output";

export function setupValidationTests({ output }: TestOutput) {
  const claimSelect =
    document.querySelector<HTMLSelectElement>("#validation-claim");
  const clinicianSelect = document.querySelector<HTMLSelectElement>(
    "#validation-clinician",
  );
  sampleClinicians.forEach((clinician) => {
    const option = document.createElement("option");
    option.value = clinician.clinicianId;
    option.textContent = `${clinician.clinicianId} — ${clinician.firstName} ${clinician.lastName} (${clinician.role})`;
    clinicianSelect?.append(option);
  });
  const knownLocationIds = sampleLocations.map(
    (location) => location.locationId,
  );
  sampleClaims.forEach((claim) => {
    const option = document.createElement("option");
    option.value = claim.claimId;
    option.textContent = `${claim.claimId} (${claim.status})`;
    if (!knownLocationIds.includes(claim.locationId)) {
      option.textContent += ` — Unknown clinic ID: ${claim.locationId}`;
    }
    claimSelect?.append(option);
  });

  document.querySelector("#validate-claim")?.addEventListener("click", () => {
    if (!output) return;
    try {
      const claim = sampleClaims.find(
        (claim) => claim.claimId === claimSelect?.value,
      );
      if (!claim) throw new Error("Select a claim to validate.");
      const result = validateClaim(claim, knownLocationIds);
      showResult(
        output,
        `Validation for ${claim.claimId}:`,
        result,
        result.valid
          ? "Valid claim: all business rules pass."
          : result.errors.join("\n"),
      );
    } catch (error) {
      output.textContent =
        error instanceof Error ? error.message : String(error);
    }
  });

  document
    .querySelector("#validate-clinician")
    ?.addEventListener("click", () => {
      if (!output) return;
      try {
        const clinician = sampleClinicians.find(
          (clinician) => clinician.clinicianId === clinicianSelect?.value,
        );
        if (!clinician) throw new Error("Select a clinician to validate.");
        const result = validateClinician(clinician);
        showResult(
          output,
          `Validation for ${clinician.clinicianId}:`,
          result,
          result.valid
            ? "Valid clinician: all business rules pass."
            : result.errors.join("\n"),
        );
      } catch (error) {
        output.textContent =
          error instanceof Error ? error.message : String(error);
      }
    });

  return () => {
    if (claimSelect) claimSelect.selectedIndex = 0;
    if (clinicianSelect) clinicianSelect.selectedIndex = 0;
  };
}
