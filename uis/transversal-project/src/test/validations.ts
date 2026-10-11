import { sampleClaims, sampleLocations } from "../data/sampleData";
import { validateClaim } from "../utils/validations";
import { showResult, type TestOutput } from "./output";

export function setupValidationTests({ output }: TestOutput) {
  const claimSelect =
    document.querySelector<HTMLSelectElement>("#validation-claim");
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

  return () => {
    if (claimSelect) claimSelect.selectedIndex = 0;
  };
}
