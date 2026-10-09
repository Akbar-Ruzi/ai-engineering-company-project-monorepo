import { sampleClaims, sampleLocations } from "../data/sampleData";
import {
  calculateDenialRate,
  denialRateByLocation,
  denialRateByPayer,
  flagHighDenialPayers,
} from "../utils/transformations";
import type { TestOutput } from "./output";

export function setupTransformationTests({ output }: TestOutput) {
  document
    .querySelector("#flag-high-denial-payers")
    ?.addEventListener("click", () => {
      if (!output) return;

      try {
        const payers = flagHighDenialPayers(sampleClaims);
        output.textContent =
          "Payers with denial rates above 8%:\n" +
          (payers.length > 0 ? payers.join("\n") : "No payers returned.");
      } catch (error) {
        output.textContent =
          error instanceof Error ? error.message : String(error);
      }
    });

  document.querySelector("#denial-location")?.addEventListener("click", () => {
    if (!output) return;

    try {
      const rates = denialRateByLocation(sampleClaims);
      output.textContent =
        "Denial rate by location:\n" +
        Object.entries(rates)
          .map(([locationId, rate]) => {
            const locationName =
              sampleLocations.find(
                (location) => location.locationId === locationId,
              )?.name ?? "Unknown location";
            return `${locationId} --> ${locationName}: ${rate.toFixed(2)}%`;
          })
          .join("\n");
    } catch (error) {
      output.textContent =
        error instanceof Error ? error.message : String(error);
    }
  });

  document.querySelector("#denial-rate")?.addEventListener("click", () => {
    if (!output) return;

    try {
      const rate = calculateDenialRate(sampleClaims);
      output.textContent = `Denial rate: ${rate.toFixed(2)}%`;
    } catch (error) {
      output.textContent =
        error instanceof Error ? error.message : String(error);
    }
  });

  document.querySelector("#denial-payer")?.addEventListener("click", () => {
    if (!output) return;

    try {
      const rates = denialRateByPayer(sampleClaims);
      output.textContent =
        "Denial rate by payer:\n" +
        Object.entries(rates)
          .map(([payer, rate]) => `${payer}: ${rate.toFixed(2)}%`)
          .join("\n");
    } catch (error) {
      output.textContent =
        error instanceof Error ? error.message : String(error);
    }
  });
}
