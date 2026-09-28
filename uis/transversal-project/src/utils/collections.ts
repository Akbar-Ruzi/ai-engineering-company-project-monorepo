import type { Claim, AppointmentStatus, Appointment } from "../types/models";
export function filterClaims(claims: Claim[], filters: Partial<Pick<Claim, "locationId" | "status" | "payerName" | "serviceType">>): Claim[] {
    return claims.filter(claim => {
        return (
            (filters.locationId === undefined || filters.locationId === claim.locationId) &&
            (filters.status === undefined || filters.status === claim.status) &&
            (filters.payerName === undefined || filters.payerName === claim.payerName) &&
            (filters.serviceType === undefined || filters.serviceType === claim.serviceType)
        )
    })
}

export function filterAppointmentsByStatus(appointments: Appointment[], status: AppointmentStatus[]): Appointment[] {
    return appointments.filter(appointment => status.includes(appointment.status));
}

export function sortClaimsById(claims: Claim[], direction: "asc" | "desc"): Claim[] {
    return [...claims].sort((a, b) =>
        direction === "asc"
            ? a.claimId.localeCompare(b.claimId)
            : b.claimId.localeCompare(a.claimId)
    );
}

export function sortAppointmentsByDate(appointments: Appointment[], direction: "asc" | "desc"): Appointment[] {
    return [...appointments].sort((a, b) =>
        direction === 'asc'
            ? new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
            : new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
    )
}