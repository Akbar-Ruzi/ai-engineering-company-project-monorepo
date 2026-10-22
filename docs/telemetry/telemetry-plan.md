# HealthCore — Telemetry Plan

- **Version:** 1.0.0
- **Author:** Akbar
- **Date:** 2026-10-21
- **Status:** Draft

## 1. Executive summary

_Why HealthCore needs telemetry now: the questions operations cannot answer today._

## 2. Mandatory metrics

These 5 metrics are required by `healthcore-BRIEFING.md` and are labeled **mandatory**. Their `event_type` names are fixed by the BRIEFING and must not be renamed. They form the floor of this plan, not the ceiling.

| `event_type`                 | Fires when                                                                  | Hypothesis                                                                      | Decision                                                               |
| ---------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `inbound_order_created`      | A clinic registers receipt of supplies from a vendor                        | How much and what supply is being purchased, by clinic and vendor               | Consolidate purchasing across clinics, negotiate better vendor terms   |
| `outbound_order_created`     | A clinic registers consumption of a supply in a department's care activity  | Which supplies are consumed most, at what rate, by clinic and department        | Adjust automatic replenishment of critical supplies per clinic         |
| `stock_threshold_triggered`  | A supply's stock at a clinic falls below the configured minimum             | How often a clinic runs short of a critical supply (e.g. PPE, medication)       | Prioritise urgent restocking, escalate to Marcus (Clinical Operations) |
| `direct_stock_edit_rejected` | A user attempts to modify stock directly and the system rejects it          | Whether staff are attempting to bypass supply traceability controls             | Reinforce training or permissions at the clinic where it happens most  |
| `supply_expiry_flagged`      | A supply batch approaches its expiry date (within 30 days)                  | Which supplies are about to expire before they become waste or compliance risk  | Prioritise use or controlled disposal before expiry                    |

### `inbound_order_created`

- **Class:** mandatory (from BRIEFING)
- **Definition:** Fires once when an inbound order (receipt of supplies from a vendor at a clinic) is saved successfully and the product's stock has been incremented.
- **Data components:** `clinic_id`, `country`, `product_id`, `product_category`, `quantity`, `vendor_id`, `order_id`
- **System touchpoint:** Backend, inbound order creation. Emitted after the order and the stock increment are committed, never on form submit, so failed or rolled-back orders are not counted.
- **Golden rule:** We capture `inbound_order_created` because we need to know how much and what supply each clinic is purchasing, and from which vendor, which allows us to consolidate purchasing across clinics and negotiate better vendor terms.

### `outbound_order_created`

- **Class:** mandatory (from BRIEFING)
- **Definition:** Fires once when an outbound order (consumption of a supply during a department's care activity) is saved successfully and the product's stock has been decremented.
- **Data components:** `clinic_id`, `country`, `product_id`, `product_category`, `quantity`, `department`, `order_id`
- **System touchpoint:** Backend, outbound order creation. Emitted after the order and the stock decrement are committed. Consumption is recorded by `department` only, never by patient.
- **Golden rule:** We capture `outbound_order_created` because we need to know which supplies are consumed most and at what rate, by clinic and department, which allows us to adjust automatic replenishment of critical supplies per clinic.

### `stock_threshold_triggered`

- **Class:** mandatory (from BRIEFING)
- **Definition:** Fires when a product's stock at a clinic crosses from at or above its configured minimum to below it. It fires on the crossing only, not on every order while stock stays below the minimum.
- **Data components:** `clinic_id`, `country`, `product_id`, `product_category`, `quantity`, `department`, `current_stock`, `min_threshold`
- **System touchpoint:** Backend, stock recalculation after an outbound order is committed. The check compares the stock before and after the order (`previous_stock >= min_threshold` and `current_stock < min_threshold`).
- **Golden rule:** We capture `stock_threshold_triggered` because we need to know how often each clinic runs short of a critical supply such as PPE or medication, which allows us to prioritise urgent restocking and escalate to Marcus (Clinical Operations).

### `direct_stock_edit_rejected`

- **Class:** mandatory (from BRIEFING)
- **Definition:** Fires when a staff user tries to change a product's stock directly (not through an `InboundOrder` or `OutboundOrder`) and the system rejects the change.
- **Data components:** `clinic_id`, `country`, `product_id`, `product_category`, `quantity` (the attempted change), `attempt_source`. The staff user is identified by the envelope's `userId`.
- **System touchpoint:** Backend, the guard that blocks direct writes to a product's stock field. Emitted at the moment the request is rejected. The backend is the source of truth: a frontend that hides the option is not enough, because the API can be called directly.
- **Golden rule:** We capture `direct_stock_edit_rejected` because we need to know whether staff are trying to bypass supply traceability controls, and at which clinics, which allows us to reinforce training or tighten permissions at the clinic where it happens most.

### `supply_expiry_flagged`

- **Class:** mandatory (from BRIEFING)
- **Definition:** Fires once when a product in stock at a clinic enters the 30-day window before its expiry date. It does not fire again every day while the product stays inside the window.
- **Data components:** `clinic_id`, `country`, `product_id`, `product_category`, `quantity` (units in stock that will expire), `expiry_date`, `days_to_expiry`
- **System touchpoint:** Backend, a scheduled daily job that checks the expiry date stored on each `Product` against today's date. No user action triggers it, so the envelope's `userId` is a service account (e.g. `system:expiry-job`).
- **Golden rule:** We capture `supply_expiry_flagged` because we need to know which supplies are about to expire before they become waste or a compliance risk, which allows us to prioritise their use or arrange controlled disposal before expiry.

## 3. Flow mapping

This section maps the journey of a staff user from logging in to completing an inbound or outbound order, and marks every point where an event is emitted.

```text
Login → Open inventory → (Direct stock edit attempt) → Submit order → Validation → Order saved → Stock recalculated
```

| # | Step                       | What can happen                                                                  | Event fired                                        | Emitted by | Class      |
| - | -------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------- | ---------- | ---------- |
| 1 | Login                      | Credentials are wrong                                                            | `login_failed`                                     | Backend    | identified |
| 2 | Any step after login       | The session expires before the order is finished                                 | `session_expired`                                  | Backend    | identified |
| 3 | Open inventory section     | The user opens the inventory or orders screen                                    | `section_viewed`                                   | Frontend   | identified |
| 4 | Direct stock edit          | The user tries to change stock directly; it is rejected                          | `direct_stock_edit_rejected`                       | Backend    | mandatory  |
| 5 | Submit order               | The server rejects the order (missing field, invalid quantity, not enough stock) | `order_validation_failed`                          | Backend    | identified |
| 6 | Order saved                | The order is saved successfully and stock is updated                             | `inbound_order_created` / `outbound_order_created` | Backend    | mandatory  |
| 7 | Stock recalculated         | Stock crosses below the configured minimum                                       | `stock_threshold_triggered`                        | Backend    | mandatory  |
| 8 | Every API call in the flow | The response time is measured                                                    | `api_latency_recorded`                             | Backend    | identified |

Each order submission ends in exactly one outcome: `order_validation_failed` (nothing saved) or `inbound_order_created` / `outbound_order_created` (saved). A user who fixes the form and resubmits produces one event per attempt.

## 4. Broad opportunity catalogue

This catalogue lists every event in the plan, grouped by category and labeled **mandatory** (from the BRIEFING) or **identified** (proposed in this plan). The mandatory events are detailed in section 2; full property definitions for every event are in section 6.

| `event_type`                 | Category       | Class      | Fires when                                                  | Why it matters                                              |
| ---------------------------- | -------------- | ---------- | ----------------------------------------------------------- | ----------------------------------------------------------- |
| `inbound_order_created`      | Inventory      | mandatory  | An inbound order is saved and stock is incremented          | Consolidate purchasing and negotiate vendor terms           |
| `outbound_order_created`     | Inventory      | mandatory  | An outbound order is saved and stock is decremented         | Adjust automatic replenishment per clinic                   |
| `stock_threshold_triggered`  | Inventory      | mandatory  | Stock at a clinic crosses below its configured minimum      | Prioritise urgent restocking, escalate to Marcus            |
| `direct_stock_edit_rejected` | Inventory      | mandatory  | A direct stock edit is attempted and rejected               | Reinforce training or permissions at that clinic            |
| `supply_expiry_flagged`      | Inventory      | mandatory  | A product in stock enters the 30-day window before expiry   | Use or dispose of supplies before they expire               |
| `order_validation_failed`    | Inventory      | identified | The server rejects a submitted order (nothing is saved)     | Fix the form fields or rules that block staff most          |
| `login_failed`               | Authentication | identified | A login attempt fails because of wrong credentials          | Detect repeated failures and alert Claire (compliance)      |
| `session_expired`            | Authentication | identified | A session times out before the user logs out                | Tune the session timeout so staff don't lose unsaved orders |
| `api_latency_recorded`       | Performance    | identified | An API request completes and its response time is measured  | Find and fix the slowest endpoints first                    |
| `page_load_recorded`         | Performance    | identified | A backoffice screen finishes loading in the browser         | Find slow screens, separately from slow APIs                |
| `frontend_error_caught`      | Errors         | identified | An uncaught error happens in the browser                    | Fix first the errors that affect the most clinics           |
| `section_viewed`             | Navigation     | identified | A user opens a backoffice section                           | Decide which sections to improve, simplify or retire        |
| `order_form_abandoned`       | Navigation     | identified | A user opens an order form and leaves without submitting it | Simplify the order forms where staff give up most           |

### Golden rules for identified events

The golden rules for the 5 mandatory events are in section 2. Every identified event completes the same sentence; an event that could not complete it would have been discarded.

- We capture `order_validation_failed` because we need to know which order fields and rules reject staff submissions most often, by clinic and order type, which allows us to fix the form fields, validation rules or training that block staff most.
- We capture `login_failed` because we need to know how often and where login attempts fail, and whether failures repeat for the same account, which allows us to alert Claire (compliance) to possible unauthorised access and lock or reset affected accounts.
- We capture `session_expired` because we need to know how often sessions time out while staff are still working, especially in the middle of an order, which allows us to tune the session timeout so staff do not lose unsaved orders without weakening security.
- We capture `api_latency_recorded` because we need to know which API endpoints are slowest, and at which clinics, which allows us to prioritise fixing the slowest endpoints first.
- We capture `page_load_recorded` because we need to know which backoffice screens load slowly in the browser, separately from slow APIs, which allows us to optimise the slowest screens first.
- We capture `frontend_error_caught` because we need to know which uncaught browser errors happen and how many clinics they affect, which allows us to fix first the errors that affect the most clinics.
- We capture `section_viewed` because we need to know which backoffice sections staff use most and least, which allows us to decide which sections to improve, simplify or retire.
- We capture `order_form_abandoned` because we need to know where staff give up on inbound and outbound order forms without submitting them, which allows us to simplify the forms where staff give up most.

## 5. Event Envelope

Every event carries the same 8 envelope fields, whatever its type. Only the content of `properties` changes from one event to another, and it is defined per event in section 6.

| Field           | Type                   | Required | Notes                                                                                                          | Example                                |
| --------------- | ---------------------- | -------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `eventId`       | string (UUID v4)       | yes      | Unique ID generated where the event is created. Consumers use it to drop duplicates.                           | `3f8a2c1e-7b4d-4e9a-9c2f-1d5e6a7b8c90` |
| `timestamp`     | string (ISO 8601, UTC) | yes      | When the event happened, always in UTC with a `Z` suffix.                                                      | `2026-10-21T14:05:00Z`                 |
| `sessionId`     | string                 | yes      | The browser or API session. Scheduled jobs use their job run ID.                                               | `sess_8d21f0`                          |
| `userId`        | string                 | yes      | Pseudonymised staff ID (never a name or email). System events use a service account.                           | `usr_a91c4e` / `system:expiry-job`     |
| `event_type`    | string                 | yes      | Event name in `entity_action` snake_case, past tense. Must match an event in section 6.                        | `inbound_order_created`                |
| `schemaVersion` | string (semver)        | yes      | Version of this event's schema. Starts at `1.0.0`.                                                             | `1.0.0`                                |
| `requestId`     | string                 | yes      | Correlation ID passed from frontend to API to logs (`X-Request-Id` header). Scheduled jobs generate their own. | `req_5b7e2d`                           |
| `properties`    | object                 | yes      | Event-specific payload. Only the keys on that event's allowlist are allowed.                                   | `{ "clinic_id": "us-tx-01", ... }`     |

**Rules:**

- All 8 fields are required on every event, and no other top-level fields are allowed. Anything event-specific goes inside `properties`.
- The envelope never carries patient data or PHI. `userId` always identifies a staff member or a service account, never a patient.
- The field names mix camelCase (`eventId`, `schemaVersion`) and snake_case (`event_type`) on purpose, to match the project README. They must be used exactly as written here and not renamed.

**Example event: `inbound_order_created`** (fake values, no real data):

```json
{
  "eventId": "3f8a2c1e-7b4d-4e9a-9c2f-1d5e6a7b8c90",
  "timestamp": "2026-10-21T14:05:00Z",
  "sessionId": "sess_8d21f0",
  "userId": "usr_a91c4e",
  "event_type": "inbound_order_created",
  "schemaVersion": "1.0.0",
  "requestId": "req_5b7e2d",
  "properties": {
    "clinic_id": "us-tx-01",
    "country": "US",
    "product_id": "prd_00412",
    "product_category": "ppe",
    "quantity": 500,
    "vendor_id": "vnd_0031",
    "order_id": "ord_20261021_0007"
  }
}
```

## 6. Event catalog

Each event below lists its golden rule, its `properties` allowlist, its PII handling, and whether it is processed as a stream or in batch. Every event also carries the full envelope from section 5. The `properties` table is the allowlist: any key not listed is rejected. Each event has a matching definition in `event-schemas.json` under the same name.

### `inbound_order_created`

- **Class / Category:** mandatory · Inventory
- **Description:** Fires once when an inbound order (receipt of supplies from a vendor at a clinic) is committed and the product's stock has been incremented.
- **Golden rule:** We capture `inbound_order_created` because we need to know how much and what supply each clinic is purchasing, and from which vendor, which allows us to consolidate purchasing across clinics and negotiate better vendor terms.

| Property           | Type    | Required | Allowlist | PII | Notes                                                                    |
| ------------------ | ------- | -------- | --------- | --- | ------------------------------------------------------------------------ |
| `clinic_id`        | string  | yes      | yes       | no  | Format `<country>-<region>-<nn>`, e.g. `us-tx-01`, `uk-lon-01`           |
| `country`          | string  | yes      | yes       | no  | `US` or `UK`                                                             |
| `product_id`       | string  | yes      | yes       | no  | Internal product ID, e.g. `prd_00412`                                    |
| `product_category` | string  | yes      | yes       | no  | `medication`, `ppe`, `consumable` or `equipment`                         |
| `quantity`         | integer | yes      | yes       | no  | Units received, ≥ 1                                                      |
| `vendor_id`        | string  | yes      | yes       | no  | Internal vendor ID, e.g. `vnd_0031`. A vendor is a company, not a person |
| `order_id`         | string  | yes      | yes       | no  | Internal inbound order ID, e.g. `ord_20261021_0007`                      |

- **PII / sanitisation:** No PII. The event describes supplies and vendors only. No `department` is included, because a vendor delivery is not tied to a care activity. The staff user is identified only by the pseudonymised `userId` in the envelope.
- **Processing:** batch (daily). Purchasing consolidation and vendor negotiation are weekly or monthly decisions, so no one needs to act on this event within minutes.

### `outbound_order_created`

- **Class / Category:** mandatory · Inventory
- **Description:** Fires once when an outbound order (consumption of a supply during a department's care activity) is committed and the product's stock has been decremented.
- **Golden rule:** We capture `outbound_order_created` because we need to know which supplies are consumed most and at what rate, by clinic and department, which allows us to adjust automatic replenishment of critical supplies per clinic.

| Property           | Type    | Required | Allowlist | PII | Notes                                                               |
| ------------------ | ------- | -------- | --------- | --- | ------------------------------------------------------------------- |
| `clinic_id`        | string  | yes      | yes       | no  | Format `<country>-<region>-<nn>`, e.g. `us-tx-01`, `uk-lon-01`      |
| `country`          | string  | yes      | yes       | no  | `US` or `UK`                                                        |
| `product_id`       | string  | yes      | yes       | no  | Internal product ID, e.g. `prd_00412`                               |
| `product_category` | string  | yes      | yes       | no  | `medication`, `ppe`, `consumable` or `equipment`                    |
| `quantity`         | integer | yes      | yes       | no  | Units consumed, ≥ 1                                                 |
| `department`       | string  | yes      | yes       | no  | `primary_care`, `specialty_care` or `chronic_care`                  |
| `order_id`         | string  | yes      | yes       | no  | Internal outbound order ID, e.g. `ord_20261021_0012`                |

- **PII / sanitisation:** No PII. Consumption is recorded by `department` only, never by patient. `department` is a fixed list of values, not free text, so a patient name or note cannot be typed into it; any other value is rejected by the schema. Adding a department requires a minor `schemaVersion` bump. The staff user is identified only by the pseudonymised `userId` in the envelope.
- **Processing:** batch (daily). Replenishment rules are adjusted periodically from consumption trends. The urgent case, a clinic running short of a supply, is covered by `stock_threshold_triggered`, which is processed as a stream.

### `stock_threshold_triggered`

- **Class / Category:** mandatory · Inventory
- **Description:** Fires once when a product's stock at a clinic crosses from at or above its configured minimum to below it, after an outbound order is committed. It fires on the crossing only, not on every order while stock stays below the minimum.
- **Golden rule:** We capture `stock_threshold_triggered` because we need to know how often each clinic runs short of a critical supply such as PPE or medication, which allows us to prioritise urgent restocking and escalate to Marcus (Clinical Operations).

| Property           | Type    | Required | Allowlist | PII | Notes                                                              |
| ------------------ | ------- | -------- | --------- | --- | ------------------------------------------------------------------ |
| `clinic_id`        | string  | yes      | yes       | no  | Format `<country>-<region>-<nn>`, e.g. `us-tx-01`, `uk-lon-01`     |
| `country`          | string  | yes      | yes       | no  | `US` or `UK`                                                       |
| `product_id`       | string  | yes      | yes       | no  | Internal product ID, e.g. `prd_00412`                              |
| `product_category` | string  | yes      | yes       | no  | `medication`, `ppe`, `consumable` or `equipment`                   |
| `quantity`         | integer | yes      | yes       | no  | Units consumed by the outbound order that crossed the minimum, ≥ 1 |
| `department`       | string  | yes      | yes       | no  | Department of that order: `primary_care`, `specialty_care` or `chronic_care` |
| `current_stock`    | integer | yes      | yes       | no  | Stock after the order, ≥ 0                                         |
| `min_threshold`    | integer | yes      | yes       | no  | Configured minimum for this product at this clinic, ≥ 1            |

- **PII / sanitisation:** No PII. The event describes stock levels only. `department` uses the same fixed list as `outbound_order_created`, so no free text can get in. The staff user is identified only by the pseudonymised `userId` in the envelope.
- **Processing:** stream. A clinic running out of PPE or medication affects care the same day, so Clinical Operations must act within minutes to restock or move supplies between clinics. Repeated alerts for the same product at the same clinic are debounced (see section 7).

### `direct_stock_edit_rejected`

- **Class / Category:** mandatory · Inventory
- **Description:** Fires once when a staff user tries to change a product's stock directly (not through an `InboundOrder` or `OutboundOrder`) and the backend guard rejects the change. Stock is not modified.
- **Golden rule:** We capture `direct_stock_edit_rejected` because we need to know whether staff are trying to bypass supply traceability controls, and at which clinics, which allows us to reinforce training or tighten permissions at the clinic where it happens most.

| Property           | Type    | Required | Allowlist | PII | Notes                                                                                   |
| ------------------ | ------- | -------- | --------- | --- | --------------------------------------------------------------------------------------- |
| `clinic_id`        | string  | yes      | yes       | no  | Format `<country>-<region>-<nn>`, e.g. `us-tx-01`, `uk-lon-01`                          |
| `country`          | string  | yes      | yes       | no  | `US` or `UK`                                                                            |
| `product_id`       | string  | yes      | yes       | no  | Internal product ID, e.g. `prd_00412`                                                   |
| `product_category` | string  | yes      | yes       | no  | `medication`, `ppe`, `consumable` or `equipment`                                        |
| `quantity`         | integer | yes      | yes       | no  | Attempted stock change, signed and never 0: `+10` to add, `-5` to remove                |
| `attempt_source`   | string  | yes      | yes       | no  | `ui` (a backoffice screen) or `api` (a direct API call, e.g. a script)                  |

- **PII / sanitisation:** No PII. The staff user is identified only by the pseudonymised `userId` in the envelope. No `department` is included, because a direct edit is not a care activity. Investigating a specific user is done in the audit system, not through telemetry.
- **Processing:** batch (daily). The decision, training or permissions, is based on patterns per clinic over weeks, and each attempt has already been blocked, so no harm is done in the meantime. `attempt_source` points to the fix: mostly `ui` suggests a training or screen problem, mostly `api` suggests a permissions problem. A burst of repeated attempts by the same user is handled as an alert rule in section 7, not by streaming every event.

### `supply_expiry_flagged`

- **Class / Category:** mandatory · Inventory
- **Description:** Fires once when a product in stock at a clinic enters the 30-day window before its expiry date. Emitted by a scheduled daily job, not by a user action. It does not fire again every day while the product stays inside the window, so the job must record which products it has already flagged.
- **Golden rule:** We capture `supply_expiry_flagged` because we need to know which supplies are about to expire before they become waste or a compliance risk, which allows us to prioritise their use or arrange controlled disposal before expiry.
- **Envelope note:** No user is logged in, so `userId` is the service account `system:expiry-job` and `sessionId` is the job's run ID.

| Property           | Type    | Required | Allowlist | PII | Notes                                                          |
| ------------------ | ------- | -------- | --------- | --- | -------------------------------------------------------------- |
| `clinic_id`        | string  | yes      | yes       | no  | Format `<country>-<region>-<nn>`, e.g. `us-tx-01`, `uk-lon-01` |
| `country`          | string  | yes      | yes       | no  | `US` or `UK`                                                   |
| `product_id`       | string  | yes      | yes       | no  | Internal product ID, e.g. `prd_00412`                          |
| `product_category` | string  | yes      | yes       | no  | `medication`, `ppe`, `consumable` or `equipment`               |
| `quantity`         | integer | yes      | yes       | no  | Units in stock that will expire, ≥ 1                           |
| `expiry_date`      | string  | yes      | yes       | no  | Calendar date `YYYY-MM-DD`, e.g. `2026-11-20` (no time part)   |
| `days_to_expiry`   | integer | yes      | yes       | no  | Days left when flagged, 0 to 30                                |

- **PII / sanitisation:** No PII. The event describes stock and expiry dates only and has no human user. No `department` is included, because nothing has been consumed.
- **Processing:** batch (daily). The job itself runs once a day and the 30-day window leaves weeks to act, so deciding whether to use the supply first or arrange disposal does not need minute-level delivery.

## 7. High-frequency strategy

_Throttle and debounce rules for high-frequency events._

## 8. Risks and exclusions

_Events considered and discarded, and data that will not be captured (PHI, credentials, out-of-scope infrastructure)._
