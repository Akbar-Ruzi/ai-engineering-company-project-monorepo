import {
  sampleAppointments,
  sampleClaims,
  sampleClinicians,
  sampleLocations,
} from "../data/sampleData";
import {
  calculateDenialRate,
  calculateNoShowCost,
  denialRateByLocation,
  denialRateByPayer,
  flagHighDenialPayers,
  flagHighNoShowLocations,
  generateCMEReport,
  getCliniciansAtRisk,
  noShowRateByLocation,
} from "../utils/transformations";
import { showResult, type TestOutput } from "./output";

const formatDaysRemaining = (days: number, pastLabel: string): string => {
  const count = Math.abs(days);
  const unit = count === 1 ? "day" : "days";
  return `${count} ${unit} ${days < 0 ? pastLabel : "remaining"}`;
};

export function setupTransformationTests({ output }: TestOutput) {
  const cmeDateInput =
    document.querySelector<HTMLInputElement>("#cme-as-of-date");

  document.querySelector("#cme-at-risk")?.addEventListener("click", () => {
    if (!output) return;

    try {
      if (!cmeDateInput?.value || !cmeDateInput.checkValidity()) {
        throw new Error("Enter a valid as-of date.");
      }

      const clinicians = getCliniciansAtRisk(
        sampleClinicians,
        cmeDateInput.value,
      );
      showResult(
        output,
        `Clinicians at risk or overdue as of ${cmeDateInput.value}:`,
        clinicians,
        clinicians.length
          ? clinicians
              .map(
                (clinician) =>
                  `${clinician.firstName} ${clinician.lastName} (${clinician.clinicianId})`,
              )
              .join("\n")
          : "No clinicians are at risk or overdue.",
      );
    } catch (error) {
      output.textContent =
        error instanceof Error ? error.message : String(error);
    }
  });

  document.querySelector("#cme-report")?.addEventListener("click", () => {
    if (!output) return;

    try {
      if (!cmeDateInput?.value || !cmeDateInput.checkValidity()) {
        throw new Error("Enter a valid as-of date.");
      }

      const reports = generateCMEReport(sampleClinicians, cmeDateInput.value);
      showResult(
        output,
        `CME report as of ${cmeDateInput.value}:`,
        reports,
        reports
          .map((report) =>
            [
              `${report.fullName} (${report.clinicianId})`,
              `Status: ${report.complianceStatus}`,
              `Hours: ${report.hoursLogged}/${report.hoursRequired}; remaining: ${report.hoursRemaining}`,
              `Complete: ${report.percentComplete.toFixed(1)}%`,
              `Cycle: ${formatDaysRemaining(report.daysRemainingInCycle, "overdue")}`,
              `Licence expires: ${report.licenceExpiryDate}; ${formatDaysRemaining(report.licenceDaysRemaining, "past expiration")}`,
            ].join("\n"),
          )
          .join("\n\n"),
      );
    } catch (error) {
      output.textContent =
        error instanceof Error ? error.message : String(error);
    }
  });

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
        showResult(
          output,
          "No-show rate by location:",
          rates,
          Object.entries(rates)
            .map(([locationId, rate]) => {
              const locationName =
                sampleLocations.find(
                  (location) => location.locationId === locationId,
                )?.name ?? "Unknown location";
              return `${locationId} --> ${locationName}: ${rate.toFixed(2)}%`;
            })
            .join("\n"),
        );
      } catch (error) {
        console.error(error);
        if (output) {
          output.textContent =
            error instanceof Error ? error.message : String(error);
        }
      }
    });

  document
    .querySelector("#flag-high-no-show-locations")
    ?.addEventListener("click", () => {
      if (!output) return;

      try {
        const locations = flagHighNoShowLocations(sampleAppointments);
        showResult(
          output,
          "Locations with no-show rates above 20%:",
          locations,
          locations
            .map((locationId) => {
              const locationName =
                sampleLocations.find(
                  (location) => location.locationId === locationId,
                )?.name ?? "Unknown location";
              return `${locationId} --> ${locationName}`;
            })
            .join("\n"),
        );
      } catch (error) {
        output.textContent =
          error instanceof Error ? error.message : String(error);
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
        `No-show cost for ${location.name} in 7 calendar days ending ${weekEndingInput.value} (inclusive)\n` +
        `$${cost}`;
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
          JSON.stringify(payers, null, 2);
      } catch (error) {
        output.textContent =
          error instanceof Error ? error.message : String(error);
      }
    });

  document.querySelector("#denial-location")?.addEventListener("click", () => {
    if (!output) return;

    try {
      const rates = denialRateByLocation(sampleClaims);
      showResult(
        output,
        "Denial rate by location:",
        rates,
        Object.entries(rates)
          .map(([locationId, rate]) => {
            const locationName =
              sampleLocations.find(
                (location) => location.locationId === locationId,
              )?.name ?? "Unknown location";
            return `${locationId} --> ${locationName}: ${rate.toFixed(2)}%`;
          })
          .join("\n"),
      );
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
        "Denial rate by payer:\n" + JSON.stringify(rates, null, 2);
    } catch (error) {
      output.textContent =
        error instanceof Error ? error.message : String(error);
    }
  });

  return () => {
    if (cmeDateInput) cmeDateInput.value = cmeDateInput.defaultValue;
    if (weekEndingInput) weekEndingInput.value = weekEndingInput.defaultValue;
  };
}
