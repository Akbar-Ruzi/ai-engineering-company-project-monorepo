import type { Clinician, CMEStatus } from "../types/models";

// ---------calculates when the clinician's CME cycle ends ------------
export const getCMECycleEnd = (startDate: string): Date => {
  const end = new Date(startDate);
  end.setUTCFullYear(end.getUTCFullYear() + 1);
  return end;
};

// determines whether the clinician is complete, overdue, at_risk, or on_track.
export const getCMEStatus = (
  clinician: Clinician,
  asOfDate: string,
): CMEStatus => {
  if (clinician.cmeHoursLogged >= clinician.cmeHoursRequired) {
    return "complete";
  }

  const start = new Date(clinician.cmeYearStartDate);
  const end = getCMECycleEnd(clinician.cmeYearStartDate);

  const current = new Date(asOfDate).getTime();

  // checks whether the reporting date has reached or passed the cycle end.
  if (current >= end.getTime()) {
    return "overdue";
  }

  const cycleProgress =
    ((current - start.getTime()) / (end.getTime() - start.getTime())) * 100;

  const percentComplete =
    (clinician.cmeHoursLogged / clinician.cmeHoursRequired) * 100;

  // This compares how much time has passed against how much work has been completed.
  if (cycleProgress - percentComplete > 15) {
    return "at_risk";
  }

  return "on_track";
};

export const getLicenceDaysRemaining = (
  clinician: Clinician,
  asOfDate: string,
): number => {
  return Math.round(
    (new Date(clinician.licenceExpiryDate).getTime() -
      new Date(asOfDate).getTime()) /
      (1000 * 60 * 60 * 24),
  );
};

// Checks YYYY-MM-DD format and rejects impossible calendar dates.
export const isValidISODate = (dateString: string): boolean => {
  const timestamp = new Date(dateString).getTime();
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(dateString) &&
    !Number.isNaN(timestamp) &&
    new Date(timestamp).toISOString().slice(0, 10) === dateString
  );
};
