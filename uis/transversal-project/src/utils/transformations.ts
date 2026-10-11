import type {
  Claim,
  Appointment,
  Location,
  Clinician,
  CMEReport,
} from "../types/models";

import {
  getCMECycleEnd,
  getCMEStatus,
  getLicenceDaysRemaining,
} from "./helpers";

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
 * mental mode:
 * Group appointments by location, loop through each group, count missed appointments, divide by the group's total,
 *  multiply by 100, and save the percentage under that location ID.
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

/**
 *  Calculate the no-show rate for each location, loop through each location and its rate,
 *  check whether the rate exceeds the threshold (default 20%), collect the IDs of locations that exceed it,
 *  and return those IDs as an array.
 */
export function flagHighNoShowLocations(
  appointments: Appointment[],
  threshold: number = 20,
): string[] {
  const result: string[] = [];
  for (const [location, rate] of Object.entries(
    noShowRateByLocation(appointments),
  )) {
    if (rate > threshold) {
      result.push(location);
    }
  }
  return result;
}

/**
 * ------- generates a report for every clinician -------------
 * -----goal is to determine:-------
  - How many CME hours remain?
  - What percentage has been completed?
  - How many days remain in the CME cycle?
  - Is the clinician on track?
  - How many days remain until their medical license expires?
  ---------Mental Model -------------
 * Loop through each clinician, calculate their required and completed CME hours,
 * determine how much time remains in their CME cycle, evaluate their compliance status,
 * calculate their licence expiry countdown, and create one report object for each clinician.
 */
export function generateCMEReport(
  clinicians: Clinician[],
  asOfDate: string,
): CMEReport[] {
  return clinicians.map((clinician) => {
    const cycleEnd = getCMECycleEnd(clinician.cmeYearStartDate);

    // Why Math.round()?
    // Because the division may produce a decimal number, and your report expects whole days.
    const daysRemainingInCycle = Math.round(
      (cycleEnd.getTime() - new Date(asOfDate).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const hoursRemaining = Math.max(
      0, // 0 means : Calculate the remaining hours, but never allow the result to go below zero.
      clinician.cmeHoursRequired - clinician.cmeHoursLogged,
    );

    const percentComplete = Number(
      ((clinician.cmeHoursLogged / clinician.cmeHoursRequired) * 100).toFixed(
        1,
      ),
    );

    return {
      clinicianId: clinician.clinicianId,
      fullName: `${clinician.firstName} ${clinician.lastName}`,
      role: clinician.role,
      locationId: clinician.locationId,
      hoursRequired: clinician.cmeHoursRequired,
      hoursLogged: clinician.cmeHoursLogged,
      hoursRemaining,
      percentComplete,
      daysRemainingInCycle,
      complianceStatus: getCMEStatus(clinician, asOfDate),
      licenceExpiryDate: clinician.licenceExpiryDate,
      licenceDaysRemaining: getLicenceDaysRemaining(clinician, asOfDate),
    };
  });
}

export function getCliniciansAtRisk(
  clinicians: Clinician[],
  asOfDate: string,
): Clinician[] {
  return clinicians.filter((clinician) => {
    const status = getCMEStatus(clinician, asOfDate);
    return status === "at_risk" || status === "overdue";
  });
}
/**
 * ---------Mental model — Big picture-------
 * Loop through each clinician, calculate how many days remain until their licence expires,
 *  keep clinicians whose remaining days fall between 0 and the threshold,
 * and return the matching clinicians.
 * Loop → Calculate Days → Compare → Keep or Skip → Return
 */
export function getCliniciansWithExpiringLicences(
  clinicians: Clinician[],
  asOfDate: string,
  daysThreshold: number,
): Clinician[] {
  return clinicians.filter((clinician) => {
    const remainingDays = getLicenceDaysRemaining(clinician, asOfDate);
    return remainingDays >= 0 && remainingDays <= daysThreshold;
  });
}
