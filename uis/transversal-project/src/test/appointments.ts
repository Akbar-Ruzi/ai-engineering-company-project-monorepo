import { filterAppointmentsByStatus, sortAppointmentsByDate } from "../utils/collections";
import { sampleAppointments } from "../data/sampleData";
import type { AppointmentStatus } from "../types/models";
import type { TestOutput } from "./output";

export function setupAppointmentTests({ output, moveOutput }: TestOutput) {
    const appointmentStatuses: AppointmentStatus[] = ["scheduled", "confirmed", "completed", "no_show", "cancelled"];
    const appointmentStatusSelect = document.querySelector<HTMLSelectElement>("#appointment-status")!;
    const sortButtons = {
        asc: document.querySelector<HTMLButtonElement>("#sort-appointments-asc")!,
        desc: document.querySelector<HTMLButtonElement>("#sort-appointments-desc")!,
    };

    (["asc", "desc"] as const).forEach((direction) => {
        sortButtons[direction].addEventListener("click", (event) => {
            moveOutput(event);
            Object.entries(sortButtons).forEach(([value, button]) => {
                button.setAttribute("aria-pressed", String(value === direction));
            });
            const appointments = sortAppointmentsByDate(sampleAppointments, direction);
            if (output) {
                output.textContent = `${appointments.length} appointment(s) sorted by scheduled date (${direction})\n\n${JSON.stringify(appointments, null, 2)}`;
            }
        });
    });

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

    return () => {
        Object.values(sortButtons).forEach((button) => button.setAttribute("aria-pressed", "false"));
        appointmentStatusSelect.value = "";
    };
}
