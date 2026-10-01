
import type { Claim, Clinician } from '../types/models';

export function findClaimById(claims: Claim[], claimId: string): Claim | null {
    const result = claims.find(item => item.claimId === claimId)
    return result ?? null;
}

export function findClinicianById(clinicians: Clinician[], clinicianId: string): Clinician | null {
    const result = clinicians.find(clinician => clinician.clinicianId === clinicianId)
    return result ?? null;
}

export function binarySearchClaimById(sortedClaims: Claim[], targetId: string): number {
    let leftIndex = 0;
    let rightIndex = sortedClaims.length - 1;
    let middleIndex: number;

    while (leftIndex <= rightIndex) {
        middleIndex = Math.floor((leftIndex + rightIndex) / 2);
        const middleClaim = sortedClaims[middleIndex];
        if (middleClaim === undefined) return -1;
        if (targetId > middleClaim.claimId) {
            leftIndex = middleIndex + 1;
        } else if (targetId < middleClaim.claimId) {
            rightIndex = middleIndex - 1;
        } else {
            return middleIndex
        }
    }
    return -1

}