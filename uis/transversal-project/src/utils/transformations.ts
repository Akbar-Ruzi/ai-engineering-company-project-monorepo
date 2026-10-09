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

/**
 * Mental Model
 * Suppose the claims look like this:
 *  Claim 1 → BlueCross → approved
    Claim 2 → Aetna     → denied
    Claim 3 → BlueCross → denied
    Claim 4 → Aetna     → approved
    Claim 5 → BlueCross → approved
    Claim 6 → Cigna     → denied

----------------

final result should conceptually look like:
  {
      BlueCross: 33.33,
      Aetna: 50,
      Cigna: 100
  }
*/
export function denialRateByPayer(claims: Claim[]): Record<string, number> {
  /**
   * Maps each payer name to an array containing all claims for that payer.
   * Practice grouping claims by payerName using reduce instead of groupClaimsBy().
   */
  const payerGroupedClaims = claims.reduce<Record<string, Claim[]>>(
    (acc, claim) => {
      const payer = claim.payerName;
      if (!acc[payer]) {
        acc[payer] = [];
      }
      acc[payer].push(claim);
      return acc;
    },
    {},
  );
  /**
   * Mental model can be:
   * Convert payerGroupedClaims from an object into an array of [key, value] pairs → iterate over those
   *  pairs with for...of → calculate a new value → add a property with that calculated value to result.
   */
  // result holds the calculated denial rate for each payer.
  const result: Record<string, number> = {};
  for (const [payerName, payerClaims] of Object.entries(payerGroupedClaims)) {
    result[payerName] = calculateDenialRate(payerClaims);
  }

  return result;
}

/**
 * Mental Model
 * For example, imagine these claims:
  Claim	Location	Status
  CLM-001	us-tx-001	approved
  CLM-002	us-fl-001	denied
  CLM-003	us-tx-001	denied
  CLM-004	us-fl-001	denied
  CLM-005	us-tx-001	approved
  =====================
  Your expected result is:
  {
    "us-tx-001": 33.33,
    "us-fl-001": 100
  }
 */

export function denialRateByLocation(claims: Claim[]): Record<string, number> {
  const groupedClaimsById = claims.reduce<Record<string, Claim[]>>(
    (acc, claim) => {
      const location = claim.locationId;
      if (!acc[location]) {
        acc[location] = [];
      }
      acc[location].push(claim);
      return acc;
    },
    {},
  );
  const result: Record<string, number> = {};
  for (const [location, claim] of Object.entries(groupedClaimsById)) {
    result[location] = calculateDenialRate(claim);
  }
  return result;
}
