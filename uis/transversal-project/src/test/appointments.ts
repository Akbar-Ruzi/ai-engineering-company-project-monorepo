import { filterAppointmentsByStatus } from "../utils/collections";
import { sampleAppointments } from "../data/sampleData";
import type { AppointmentStatus } from "../types/models";
import type { TestOutput } from "./output";

export function setupAppointmentTests({ output, moveOutput }: TestOutput) {
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

    return () => {
        appointmentStatusSelect.value = "";
    };
}
