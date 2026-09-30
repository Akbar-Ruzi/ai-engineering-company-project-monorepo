
import type { Claim, Clinician } from '../types/models';
export function findClaimById(claims: Claim[], claimId: string): Claim | null {
    const result = claims.find(item => item.claimId === claimId)
    return result ?? null;
}

export function findClinicianById(clinicians: Clinician[], clinicianId: string): Clinician | null {
    const result = clinicians.find(clinician => clinician.clinicianId === clinicianId)
    return result ?? null;
}