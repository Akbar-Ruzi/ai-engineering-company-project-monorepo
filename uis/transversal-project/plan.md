# Project Plan

Based on [CONTEXT-healthcore.en.md](CONTEXT-healthcore.en.md). Change `[ ]` to `[x]` when a task is complete.

The numbered sections follow the Required Functions order in the context. Preparation and final review are tracked separately.

## Preparation: Models and Sample Data ✅

- [x] Define and export the provided interfaces and types in `src/types/models.ts`, including `CMEReport` and `CMEStatus`.
- [x] Add and export all four sample arrays in `src/data/sampleData.ts`. Keep the provided field names and values unchanged.

## 1. Collection Operations (`src/utils/collections.ts`) ✅

- [x] `filterClaims`: match all supplied filters.
- [x] `filterAppointmentsByStatus`: match any supplied status.
- [x] `sortClaimsById`: sort ascending or descending without changing the original array.
- [x] `sortAppointmentsByDate`: sort ascending or descending without changing the original array.
- [x] `groupClaimsBy`: group by location, payer, status, or service type.

## 2. Search Operations (`src/utils/search.ts`) ✅

- [x] `findClaimById`: use linear search; return the claim or `null`.
- [x] `findClinicianById`: use linear search; return the clinician or `null`.
- [x] `binarySearchClaimById`: search claims sorted by ID ascending; return the index or `-1`.

## 3. Billing Denial Rate Calculator (`src/utils/transformations.ts`) ✅

- [x] `calculateDenialRate`: count only `denied` claims, return a percentage rounded to 2 decimals, and throw for an empty array.
- [x] `denialRateByPayer`: calculate the rate for each payer present. The HTML button displays the returned object with numeric percentages.
- [x] `denialRateByLocation`: calculate the rate for each location present. The HTML button displays the returned object beside clinic names and formatted percentages.
- [x] `flagHighDenialPayers`: return payers above the threshold; default to 8%. Connected to the HTML button, displaying the returned string array; checks passed for the context example, custom thresholds, exact threshold boundaries, empty input, no denials, and preserving the input.

## 4. No-Show Cost Estimator (`src/utils/transformations.ts`) ✅

- [x] `calculateNoShowCost`: use the selected clinic's service fees for the 7 calendar days ending on the supplied date, inclusive. Round USD to 2 decimals; return 0 when there are no no-shows. Connected to the HTML clinic/date controls, with output directly below Calculate No-Show Cost and above the divider. Displays the clinic and inclusive date range on the first line, and the dollar amount (for example, $220) on the second. Clear restores the default week-ending date. Verified sample totals (Austin $220, Miami $555, Atlanta $0 for 2025-03-14), inclusive month/year/leap-year boundaries, clinic/status filtering, rounding, empty arrays, input preservation, button results, missing-date feedback, and Clear reset. Typecheck passed.
- [x] `noShowRateByLocation`: calculate each location's percentage, rounded to 2 decimals. Connected to the HTML button; displays the returned object beside clinic names and formatted rates. Verified sample rates (Austin 50%, Miami 100%, Atlanta 0%), empty input, rounding, all appointment statuses, all/no no-shows, and input preservation. Matches the Context; typecheck passed.
- [x] `flagHighNoShowLocations`: return location IDs as a string array above the threshold; default to 20%. Connected to the HTML button; displays the array beside clinic names. Verified sample IDs (us-tx-001, us-fl-001), custom thresholds, exact 20%/50%/100% boundaries, empty input, no no-shows, and input preservation. Matches the Context; typecheck passed.

## 5. CME Compliance Tracker (`src/utils/transformations.ts`) ✅

- [x] `generateCMEReport`: report fields, remaining hours (minimum 0), calendar days left in the cycle, and signed days until licence expiry are implemented. Still round the returned numeric completion percentage to 1 decimal and verify zero required hours and date boundaries.
- [x] `getCliniciansAtRisk`: return clinicians who are `at_risk` or `overdue`; connected to the HTML button and as-of date input.
- [x] `getCliniciansWithExpiringLicences`: returns licences expiring from the as-of date through the threshold date, inclusive; excludes expired licences. Connected to a separate licence as-of date input and a 90-day first-alert / 30-day urgent-alert dropdown. Clear restores the date and threshold defaults. Verified sample alerts, inclusive 0/30/90-day boundaries, expired exclusions, leap-year dates, empty input, and input preservation; typecheck passed.

## 6. Validations (`src/utils/validations.ts`)

- [x] `validateClaim`: checks positive amounts, valid nonfuture submission dates, known locations, patient ID format, and required denial reasons. Returns `valid` and one error per failed rule. Connected to the HTML claim dropdown and Validate Claim button; Clear resets the selection. Verified all sample claims, five simultaneous errors, today's date, invalid dates and NaN amounts, patient ID boundaries, and input preservation; typecheck passed.
- [x] `validateClinician`: checks nonnegative CME hours (including zero, rejecting NaN), the four allowed roles, and valid YYYY-MM-DD licence dates; flags expired licences while allowing today and future dates. Returns `valid` and all errors without modifying input. Connected to the clinician dropdown and Validate Clinician button, with output below its row and Clear resetting the selection. Verified sample cases, date boundaries, all four errors together, and TypeScript.
- [x] `isDenialRateAboveThreshold`: returns whether the required rate strictly exceeds the threshold (default 8%). The UI calculates the sample denial rate and passes it to the utility. Connected to Check Denial Rate Threshold and its percentage input; output appears below the row and Clear restores 8%. Verified supplied sample rate, custom thresholds, equality and boundary cases, and TypeScript.
- [ ] `isNoShowRateAboveThreshold`: check whether the rate exceeds the threshold; default to 20%.
- [ ] Cover the appointment rules: valid 24-hour `HH:MM`, known location, and a warning for a missing no-show reason (do not reject). The context lists these rules but does not specify a validator function signature.

## Final Test and Review

- [ ] Test every function with the provided sample data and check expected results (sample overall denial rate: 40%).
- [ ] Test invalid records, empty arrays, missing optional fields, zero required CME hours, and date/threshold boundaries.
- [ ] Confirm sorting and filtering leave the original arrays unchanged.
- [ ] Keep functions based on their inputs, without global state; use correct types and no `any`.
- [ ] Run `npm.cmd run typecheck` and fix all errors.
- [ ] Add automated assertions and replace the placeholder `npm test` script.
- [ ] Connect the existing HTML controls through the helpers in `src/test/` to display results and errors. This is a project testing aid; a new HTML form is not required by the context.
