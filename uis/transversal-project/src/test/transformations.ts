import {
  sampleAppointments,
  sampleClaims,
  sampleLocations,
} from "../data/sampleData";
import {
  calculateDenialRate,
  calculateNoShowCost,
  denialRateByLocation,
  denialRateByPayer,
  flagHighDenialPayers,
  noShowRateByLocation,
} from "../utils/transformations";
import type { TestOutput } from "./output";

export function setupTransformationTests({ output }: TestOutput) {
  const locationSelect =
    document.querySelector<HTMLSelectElement>("#no-show-location");
  const weekEndingInput = document.querySelector<HTMLInputElement>(
    "#no-show-week-ending",
  );

  sampleLocations.forEach((location) => {
    const option = document.createElement("option");
    option.value = location.locationId;
    option.textContent = location.name;
    locationSelect?.append(option);
  });

  document
    .querySelector("#no-show-rate-location")
    ?.addEventListener("click", () => {
      try {
        const rates = noShowRateByLocation(sampleAppointments);
        if (!output) return;
        output.textContent =
          "No-show rate by location:\n" +
          (Object.entries(rates)
            .map(([locationId, rate]) => {
              const locationName =
                sampleLocations.find(
                  (location) => location.locationId === locationId,
                )?.name ?? "Unknown location";
              return `${locationId} --> ${locationName}: ${rate.toFixed(2)}%`;
            })
            .join("\n") ||
            "No rates returned yet. Check the browser console for your logs.");
      } catch (error) {
        console.error(error);
        if (output) {
          output.textContent =
            error instanceof Error ? error.message : String(error);
        }
      }
    });

  document.querySelector("#no-show-cost")?.addEventListener("click", () => {
    if (!output) return;

    try {
      const location = sampleLocations.find(
        (location) => location.locationId === locationSelect?.value,
      );
      if (!location) throw new Error("Select a clinic.");
      if (!weekEndingInput?.value || !weekEndingInput.checkValidity()) {
        throw new Error("Enter a valid week-ending date.");
      }

      const cost = calculateNoShowCost(
        sampleAppointments,
        location,
        weekEndingInput.value,
      );
      output.textContent =
        `No-show cost for ${location.name}\n` +
        `7 calendar days ending ${weekEndingInput.value} (inclusive)\n` +
        `Estimated revenue lost: $${cost.toFixed(2)} USD`;
    } catch (error) {
      output.textContent =
        error instanceof Error ? error.message : String(error);
    }
  });

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

  return () => {
    if (weekEndingInput) weekEndingInput.value = weekEndingInput.defaultValue;
  };
}
