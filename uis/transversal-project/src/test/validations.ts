import {
  sampleClaims,
  sampleClinicians,
  sampleLocations,
} from "../data/sampleData";
import {
  validateClaim,
  validateClinician,
  isDenialRateAboveThreshold,
} from "../utils/validations";
import { calculateDenialRate } from "../utils/transformations";
import { showResult, type TestOutput } from "./output";

export function setupValidationTests({ output }: TestOutput) {
  const thresholdInput = document.querySelector<HTMLInputElement>(
    "#denial-rate-threshold",
  );
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

  document
    .querySelector("#check-denial-threshold")
    ?.addEventListener("click", () => {
      if (!output || !thresholdInput) return;
      if (thresholdInput.value === "" || !thresholdInput.checkValidity()) {
        output.textContent =
          "Enter a denial rate threshold between 0 and 100%.";
        return;
      }
      const threshold = thresholdInput.valueAsNumber;
      const rate = calculateDenialRate(sampleClaims);
      const result = isDenialRateAboveThreshold(rate, threshold);
      showResult(
        output,
        "Denial rate threshold check:",
        result,
        `Sample claim denial rate: ${rate}%\nThreshold: ${threshold}%\n${result ? "Denial rate exceeds the threshold." : "Denial rate does not exceed the threshold."}`,
      );
    });

  return () => {
    if (thresholdInput) thresholdInput.value = "8";
    if (claimSelect) claimSelect.selectedIndex = 0;
    if (clinicianSelect) clinicianSelect.selectedIndex = 0;
  };
}
