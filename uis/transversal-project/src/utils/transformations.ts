import type { Claim, Appointment, Location } from "../types/models";

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

/**
 * Mental Model:
 *  Payer	      Denial rate  	Above 8%?
    Aetna	      12.5%         	Yes
    Cigna	      6.5%          	No
    BlueCross	  9.2%	          Yes
    Medicare	8%	            No
    ========================
    Expected result:
    ["Aetna", "BlueCross"]
 * 
 *   
 */
export function flagHighDenialPayers(
  claims: Claim[],
  threshold: number = 8,
): string[] {
  const result: string[] = [];
  for (const [payer, rate] of Object.entries(denialRateByPayer(claims))) {
    if (rate > threshold) {
      result.push(payer);
    }
  }
  return result;
}

/**
 * 
 * Mental model: Filter → Calculate → Accumulate → Return
    1. Date range: Find the 7-day period ending on weekEndingDate.
    2. Loop: Go through each appointment.
    3. Filter: Skip appointments that:
      - Are not no_show.
      - Belong to another location.
      - Fall outside the date range.
    4. Calculate: Look up the consultation fee for each qualifying appointment.
    5. Accumulate: Add each fee to totalCost.
    6. Return: Round the total to 2 decimal places.
    Remember: Check each appointment → Skip if it doesn't qualify → Add its fee if it qualifies → Return the total lost revenue.
 */

export function calculateNoShowCost(
  appointments: Appointment[],
  location: Location,
  weekEndingDate: string,
): number {
  let totalCost = 0;

  const endDate = new Date(weekEndingDate);
  // create a new Date object with the same date as endDate. Because we want to change startDate without changing endDate.
  const startDate = new Date(endDate);
  // Subtract 6 days
  startDate.setUTCDate(startDate.getUTCDate() - 6);
  // we only care about the calendar date, not the appointment time.

  const startDateString = startDate.toISOString().slice(0, 10);
  const endDateString = endDate.toISOString().slice(0, 10);

  // Loop through every appointment
  for (const appointment of appointments) {
    if (appointment.status !== "no_show") {
      // Is this appointment's status something other than no_show?
      continue; // If yes, continue skips the rest of the current iteration and moves to the next appointment.
    }
    // We only want appointments belonging to the selected clinic.
    if (appointment.locationId !== location.locationId) {
      continue;
    }
    // Extract the appointment date
    const appointmentDate = appointment.scheduledDate.slice(0, 10);

    // Check whether the appointment is outside the date range
    if (appointmentDate < startDateString || appointmentDate > endDateString) {
      continue;
    }

    // Look up the consultation fee
    const fee = location.averageConsultationFee[appointment.serviceType];
    totalCost += fee;
  }
  return Math.round((totalCost + Number.EPSILON) * 100) / 100;
}

/**
 *
 *   No-show rate = (No-show appointments / Total appointments) * 100
 *
 *
 *
 */
export function noShowRateByLocation(
  appointments: Appointment[],
): Record<string, number> {
  const groupedAppointmentsByLocation = appointments.reduce<
    Record<string, Appointment[]>
  >((acc, appointment) => {
    const location = appointment.locationId;
    if (!acc[location]) {
      acc[location] = [];
    }
    acc[location].push(appointment);
    return acc;
  }, {});
  const result: Record<string, number> = {};
  for (const [location, locationAppointments] of Object.entries(
    groupedAppointmentsByLocation,
  )) {
    const totalAppointments = locationAppointments.length;
    const noShowAppointments = locationAppointments.filter(
      (appointment) => appointment.status === "no_show",
    );
    const noShowRate = (noShowAppointments.length / totalAppointments) * 100;
    result[location] = Number(noShowRate.toFixed(2));
  }
  return result;
}
