import type { Claim } from "../types/models";
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
