import type { Claim } from "../types/models";

export function calculateDenialRate(claims: Claim[]): number {
  if (claims.length === 0) {
    throw new Error("Cannot calculate denial rate: no claims provided.");
  }
  const numOfDeniedClaims = claims.filter(
    (claim) => claim.status === "denied",
  ).length;
  const denialRate = (numOfDeniedClaims / claims.length) * 100;
  return Number(denialRate.toFixed(2));
}
