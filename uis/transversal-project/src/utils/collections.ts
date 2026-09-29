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


/**
 *  groupClaimsBy(claims, "locationId")
 * Conceptually, the result would be:
    * {
        "LOC-1": [
            { claimId: "CLM-001", locationId: "LOC-1", status: "Paid" },
            { claimId: "CLM-003", locationId: "LOC-1", status: "Pending" }
        ],

        "LOC-2": [
            { claimId: "CLM-002", locationId: "LOC-2", status: "Pending" }
        ]
    }
 */

export function groupClaimsBy(claims: Claim[], key: "locationId" | "payerName" | "status" | "serviceType"): Record<string, Claim[]> {
    const result: Record<string, Claim[]> = {}
    return claims.reduce((acc, claim) => {
        const groupKey = claim[key]
        if (!acc[groupKey]) {
            acc[groupKey] = []
        }
        acc[groupKey].push(claim);
        return acc;
    }, result)
}
