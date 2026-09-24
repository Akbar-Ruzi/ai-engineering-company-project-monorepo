# Project Plan

Based on [CONTEXT-healthcore.en.md](CONTEXT-healthcore.en.md). Change `[ ]` to `[x]` when a task is complete.

## 1. Models and Sample Data

- [x] Define and export the provided interfaces and types in `src/types/models.ts`, including `CMEReport` and `CMEStatus`.
- [x] Add and export all four sample arrays in `src/data/sampleData.ts`. Keep the provided field names and values unchanged.

## 2. Collections (`src/utils/collections.ts`)

- [ ] `filterClaims`: match all supplied filters.
- [ ] `filterAppointmentsByStatus`: match any supplied status.
- [ ] `sortClaimsById`: sort ascending or descending without changing the original array.
- [ ] `sortAppointmentsByDate`: sort ascending or descending without changing the original array.
- [ ] `groupClaimsBy`: group by location, payer, status, or service type.

## 3. Searches (`src/utils/search.ts`)

- [ ] `findClaimById`: use linear search; return the claim or `null`.
- [ ] `findClinicianById`: use linear search; return the clinician or `null`.
- [ ] `binarySearchClaimById`: search claims sorted by ID ascending; return the index or `-1`.

## 4. Validation (`src/utils/validations.ts`)

- [ ] `validateClaim`: check positive amounts, nonfuture submission dates, known locations, patient ID format, and required denial reasons. Return `valid` and one error per failed rule.
- [ ] `validateClinician`: check nonnegative CME hours, allowed roles, and valid licence dates; flag expired licences. Return `valid` and errors.
- [ ] `isDenialRateAboveThreshold`: check whether the rate exceeds the threshold; default to 8%.
- [ ] `isNoShowRateAboveThreshold`: check whether the rate exceeds the threshold; default to 20%.
- [ ] Cover the appointment rules: valid 24-hour `HH:MM`, known location, and a warning for a missing no-show reason (do not reject). The context lists these rules but does not specify a validator function signature.

## 5. Billing Denials (`src/utils/transformations.ts`)

- [ ] `calculateDenialRate`: count only `denied` claims, return a percentage rounded to 2 decimals, and throw for an empty array.
- [ ] `denialRateByPayer`: calculate the rate for each payer present.
- [ ] `denialRateByLocation`: calculate the rate for each location present.
- [ ] `flagHighDenialPayers`: return payers above the threshold; default to 8%.

## 6. No-Shows (`src/utils/transformations.ts`)

- [ ] `calculateNoShowCost`: use the selected clinic's service fees for the 7 calendar days ending on the supplied date, inclusive. Round USD to 2 decimals; return 0 when there are no no-shows.
- [ ] `noShowRateByLocation`: calculate each location's percentage, rounded to 2 decimals.
- [ ] `flagHighNoShowLocations`: return locations above the threshold; default to 20%.

## 7. CME Compliance (`src/utils/transformations.ts`)

- [ ] `generateCMEReport`: calculate remaining hours (minimum 0), completion percentage (1 decimal), calendar days left in the cycle, and days until licence expiry.
- [ ] Apply CME statuses: `complete` when required hours are met; otherwise `overdue` after the cycle ends, `at_risk` when active and more than 15 percentage points behind cycle progress, or `on_track`.
- [ ] `getCliniciansAtRisk`: return clinicians who are `at_risk` or `overdue`.
- [ ] `getCliniciansWithExpiringLicences`: find licences expiring within the supplied days; test 90-day and 30-day alerts.
- [ ] Follow the reference requirements: physicians need 40 CME hours/year; nurse practitioners need 30.

## 8. Test and Review

- [ ] Test every function with the provided sample data and check expected results (sample overall denial rate: 40%).
- [ ] Test invalid records, empty arrays, missing optional fields, zero required CME hours, and date/threshold boundaries.
- [ ] Confirm sorting and filtering leave the original arrays unchanged.
- [ ] Keep functions based on their inputs, without global state; use correct types and no `any`.
- [ ] Run `npm.cmd run typecheck` and fix all errors.
- [ ] Add automated assertions and replace the placeholder `npm test` script.
- [ ] Connect the existing HTML buttons in `src/test.ts` to display results and errors. This is a project testing aid; a new HTML form is not required by the context.
