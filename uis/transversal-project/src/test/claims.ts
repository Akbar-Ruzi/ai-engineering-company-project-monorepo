import { filterClaims } from "../utils/collections";
import { sampleClaims, sampleLocations } from "../data/sampleData";
import type { Claim, ClaimStatus, ServiceType } from "../types/models";
import type { TestOutput } from "./output";

export function setupClaimTests({ output }: TestOutput) {
    const locationSelect = document.querySelector<HTMLSelectElement>("#claim-location")!;
    const statusSelect = document.querySelector<HTMLSelectElement>("#claim-status")!;
    const payerSelect = document.querySelector<HTMLSelectElement>("#claim-payer")!;
    const serviceSelect = document.querySelector<HTMLSelectElement>("#claim-service")!;

    const statuses: ClaimStatus[] = ["submitted", "approved", "denied", "pending", "appealed"];
    const services: ServiceType[] = ["primary_care", "chronic_disease", "preventive", "specialist", "womens_health", "paediatric", "mental_health"];

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
        const filters: Partial<Pick<Claim, "locationId" | "status" | "payerName" | "serviceType">> = {};

        // Leave out any filter whose dropdown is set to "All".
        if (locationSelect.value) filters.locationId = locationSelect.value;
        if (payerSelect.value) filters.payerName = payerSelect.value;
        const status = statuses.find((value) => value === statusSelect.value);
        const service = services.find((value) => value === serviceSelect.value);
        if (status) filters.status = status;
        if (service) filters.serviceType = service;

        const claims = filterClaims(sampleClaims, filters);
        if (output) {
            output.textContent = claims.length === 0
                ? "No claims match the selected filters."
                : `${claims.length} matching claim(s)\n\n${JSON.stringify(claims, null, 2)}`;
        }
    });

    document.querySelector("#reset-filters")?.addEventListener("click", () => {
        [locationSelect, statusSelect, payerSelect, serviceSelect].forEach((select) => {
            select.value = "";
        });
        if (output) output.textContent = "";
    });

    return () => {
        [locationSelect, statusSelect, payerSelect, serviceSelect].forEach((select) => {
            select.value = "";
        });
    };
}
