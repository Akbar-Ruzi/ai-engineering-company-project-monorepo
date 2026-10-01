import {
  filterClaims,
  sortClaimsById,
  groupClaimsBy,
} from "../utils/collections";
import { sampleClaims, sampleLocations } from "../data/sampleData";
import type { Claim, ClaimStatus, ServiceType } from "../types/models";
import type { TestOutput } from "./output";

export function setupClaimTests({ output, moveOutput }: TestOutput) {
  const locationSelect =
    document.querySelector<HTMLSelectElement>("#claim-location")!;
  const statusSelect =
    document.querySelector<HTMLSelectElement>("#claim-status")!;
  const payerSelect =
    document.querySelector<HTMLSelectElement>("#claim-payer")!;
  const serviceSelect =
    document.querySelector<HTMLSelectElement>("#claim-service")!;
  const groupSelect =
    document.querySelector<HTMLSelectElement>("#claim-group-key")!;
  const groupKeys = [
    "locationId",
    "payerName",
    "status",
    "serviceType",
  ] as const;

  groupSelect.addEventListener("change", (event) => {
    moveOutput(event);
    const key = groupKeys.find((value) => value === groupSelect.value);
    if (!key) return;
    const groups = groupClaimsBy(sampleClaims, key);
    if (output) {
      output.textContent = `${Object.keys(groups).length} group(s) by ${groupSelect.selectedOptions[0]?.textContent}\n\n${JSON.stringify(groups, null, 2)}`;
    }
  });
  const sortButtons = {
    asc: document.querySelector<HTMLButtonElement>("#sort-claims-asc")!,
    desc: document.querySelector<HTMLButtonElement>("#sort-claims-desc")!,
  };

  const statuses: ClaimStatus[] = [
    "submitted",
    "approved",
    "denied",
    "pending",
    "appealed",
  ];
  const services: ServiceType[] = [
    "primary_care",
    "chronic_disease",
    "preventive",
    "specialist",
    "womens_health",
    "paediatric",
    "mental_health",
  ];

  // Show city names, but use location IDs when filtering.
  sampleLocations.forEach((location) => {
    locationSelect.add(new Option(location.city, location.locationId));
  });
  statuses.forEach((status) => statusSelect.add(new Option(status, status)));
  new Set(sampleClaims.map((claim) => claim.payerName)).forEach((payer) => {
    payerSelect.add(new Option(payer, payer));
  });
  services.forEach((service) => {
    serviceSelect.add(new Option(service.replace(/_/g, " "), service));
  });

  document.querySelector("#filter-claims")?.addEventListener("click", () => {
    const filters: Partial<
      Pick<Claim, "locationId" | "status" | "payerName" | "serviceType">
    > = {};

    // Leave out any filter whose dropdown is set to "All".
    if (locationSelect.value) filters.locationId = locationSelect.value;
    if (payerSelect.value) filters.payerName = payerSelect.value;
    const status = statuses.find((value) => value === statusSelect.value);
    const service = services.find((value) => value === serviceSelect.value);
    if (status) filters.status = status;
    if (service) filters.serviceType = service;

    const claims = filterClaims(sampleClaims, filters);
    if (output) {
      output.textContent =
        claims.length === 0
          ? "No claims match the selected filters."
          : `${claims.length} matching claim(s)\n\n${JSON.stringify(claims, null, 2)}`;
    }
  });

  (["asc", "desc"] as const).forEach((direction) => {
    sortButtons[direction].addEventListener("click", () => {
      Object.entries(sortButtons).forEach(([value, button]) => {
        button.setAttribute("aria-pressed", String(value === direction));
      });
      const claims = sortClaimsById(sampleClaims, direction);
      if (output) {
        output.textContent = `${claims.length} claim(s) sorted by claim Id (${direction})\n\n${JSON.stringify(claims, null, 2)}`;
      }
    });
  });

  document.querySelector("#reset-filters")?.addEventListener("click", () => {
    [locationSelect, statusSelect, payerSelect, serviceSelect].forEach(
      (select) => {
        select.value = "";
      },
    );
    if (output) output.textContent = "";
  });

  return () => {
    groupSelect.value = "";
    Object.values(sortButtons).forEach((button) =>
      button.setAttribute("aria-pressed", "false"),
    );
    [locationSelect, statusSelect, payerSelect, serviceSelect].forEach(
      (select) => {
        select.value = "";
      },
    );
  };
}
