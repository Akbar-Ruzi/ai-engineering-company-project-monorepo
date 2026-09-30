
import type { Claim } from '../types/models';
export function findClaimById(claims: Claim[], claimId: string): Claim | null {
    const result = claims.find(item => item.claimId === claimId)
    return result ?? null;
}