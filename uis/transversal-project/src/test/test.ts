import { filterClaims, filterAppointmentsByStatus } from "../utils/collections";
import { sampleClaims, sampleLocations, sampleAppointments } from "../data/sampleData";
import "./partialHtmls";
import type { AppointmentStatus, Claim, ClaimStatus, ServiceType } from "../types/models";

const output = document.querySelector<HTMLPreElement>("#output");
const outputPanel = document.querySelector<HTMLElement>("#output-panel");
let activeSection: HTMLElement | null = null;

// Keep one output panel and move it below the section being used.
function moveOutput(event: Event) {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !outputPanel || !output) return;
    if (outputPanel.contains(target)) return;

    const section = target.closest("section");
    if (!section) return;
    if (section !== activeSection) {
        activeSection = section;
        section.after(outputPanel);
        outputPanel.hidden = false;
        output.textContent = section.contains(document.querySelector("#appointment-status"))
            ? "Select an appointment status to see the result..."
            : "Click a test button to see the result...";
    }

    const button = target.closest("button");
    if (event.type === "click" && button && button.id !== "filter-claims" && button.id !== "reset-filters") {
        output.textContent = `${button.textContent?.trim()}: this test is not connected yet.`;
    }
}

document.querySelector("main")?.addEventListener("focusin", moveOutput);
document.querySelector("main")?.addEventListener("click", moveOutput, true);

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

const appointmentStatuses: AppointmentStatus[] = ["scheduled", "confirmed", "completed", "no_show", "cancelled"];
const appointmentStatusSelect = document.querySelector<HTMLSelectElement>("#appointment-status")!;

appointmentStatusSelect.addEventListener("change", (event) => {
    moveOutput(event);
    const selectedStatuses = appointmentStatuses.filter((status) => status === appointmentStatusSelect.value);
    const appointments = filterAppointmentsByStatus(sampleAppointments, selectedStatuses);
    if (output) {
        output.textContent = appointments.length === 0
            ? "No appointments match the selected status."
            : `${appointments.length} matching appointment(s)\n\n${JSON.stringify(appointments, null, 2)}`;
    }
});

document.querySelector("#clear-output")?.addEventListener("click", () => {
    [locationSelect, statusSelect, payerSelect, serviceSelect, appointmentStatusSelect].forEach((select) => {
        select.value = "";
    });
    if (output) output.textContent = "";
});
