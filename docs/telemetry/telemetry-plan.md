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

- All 8 envelope fields are required on every event, and no other top-level fields are allowed. Anything event-specific goes inside `properties`.
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

### `order_validation_failed`

- **Class / Category:** identified · Inventory
- **Description:** Fires once when the backend rejects a submitted inbound or outbound order and nothing is saved. One event per submission, carrying the first validation error; a user who fixes the form and resubmits produces a new event per failed attempt.
- **Golden rule:** We capture `order_validation_failed` because we need to know which order fields and rules reject staff submissions most often, by clinic and order type, which allows us to fix the form fields, validation rules or training that block staff most.

| Property       | Type   | Required | Allowlist | PII | Notes                                                                                      |
| -------------- | ------ | -------- | --------- | --- | ------------------------------------------------------------------------------------------ |
| `clinic_id`    | string | yes      | yes       | no  | Format `<country>-<region>-<nn>`, e.g. `us-tx-01`, `uk-lon-01`                             |
| `country`      | string | yes      | yes       | no  | `US` or `UK`                                                                               |
| `order_type`   | string | yes      | yes       | no  | `inbound` or `outbound`                                                                    |
| `error_code`   | string | yes      | yes       | no  | `missing_field`, `invalid_value`, `insufficient_stock` or `unknown_product`                |
| `failed_field` | string | yes      | yes       | no  | `product_id`, `quantity`, `vendor_id` or `department`                                      |
| `product_id`   | string | no       | yes       | no  | Internal product ID, only when the submitted product exists (absent if it caused the error) |

- **PII / sanitisation:** No PII. The event carries only error codes and field names, never the values the user typed: a rejected form can contain anything, including patient details entered in the wrong field. The staff user is identified only by the pseudonymised `userId` in the envelope.
- **Exception to the BRIEFING minimum:** `product_category` and `quantity` are not included, and `product_id` is optional, because the order was rejected and these values may be missing or invalid (often they are the cause of the error). Sending them would mean sending what the user typed.
- **Processing:** batch (daily). Changing forms, rules or training is decided over weeks, and the user already sees the error on screen, so no one else needs to act within minutes.

### `login_failed`

- **Class / Category:** identified · Authentication
- **Description:** Fires once when the backend rejects a login attempt. One event per failed attempt.
- **Golden rule:** We capture `login_failed` because we need to know how often and where login attempts fail, and whether failures repeat for the same account, which allows us to alert Claire (compliance) to possible unauthorised access and lock or reset affected accounts.
- **Envelope note:** No one is logged in yet, so `userId` is the pseudonymised ID of the account being tried if it exists, otherwise `anonymous`. `sessionId` is the pre-login browser session.

| Property               | Type    | Required | Allowlist | PII | Notes                                                                                      |
| ---------------------- | ------- | -------- | --------- | --- | ------------------------------------------------------------------------------------------ |
| `failure_reason`       | string  | yes      | yes       | no  | `invalid_credentials`, `account_locked` or `account_disabled`                              |
| `consecutive_failures` | integer | yes      | yes       | no  | Failed attempts in a row for this account, including this one, ≥ 1                         |
| `account_known`        | boolean | yes      | yes       | no  | `true` if the username exists. Many failures on unknown accounts suggest username guessing |
| `clinic_id`            | string  | no       | yes       | no  | The account's clinic, only when `account_known` is `true`. Format as in other events       |
| `country`              | string  | no       | yes       | no  | `US` or `UK`, only when `account_known` is `true`                                          |

- **PII / sanitisation:** The typed username, email and password are never sent, not even hashed. The account appears only as the pseudonymised `userId` in the envelope. No IP address is captured.
- **Processing:** stream. Repeated failures can mean someone is trying to break into an account with access to clinic stock, so Claire must be able to lock the account within minutes. The alert rule for repeated failures is defined in section 7.

### `session_expired`

- **Class / Category:** identified · Authentication
- **Description:** Fires once when the backend first rejects a request because the user's session has timed out, meaning the user was still working. Sessions that expire with no later request (the user left) do not fire.
- **Golden rule:** We capture `session_expired` because we need to know how often sessions time out while staff are still working, especially in the middle of an order, which allows us to tune the session timeout so staff do not lose unsaved orders without weakening security.

| Property            | Type    | Required | Allowlist | PII | Notes                                                                 |
| ------------------- | ------- | -------- | --------- | --- | --------------------------------------------------------------------- |
| `clinic_id`         | string  | yes      | yes       | no  | Format `<country>-<region>-<nn>`, e.g. `us-tx-01`, `uk-lon-01`        |
| `country`           | string  | yes      | yes       | no  | `US` or `UK`                                                          |
| `idle_minutes`      | integer | yes      | yes       | no  | Minutes since the user's last activity, ≥ 0                           |
| `timeout_minutes`   | integer | yes      | yes       | no  | Session timeout setting in force at that moment, ≥ 1                  |
| `lost_order_submit` | boolean | yes      | yes       | no  | `true` if the rejected request was an order submission (work was lost) |

- **PII / sanitisation:** No PII. The user is identified only by the pseudonymised `userId` in the envelope. No form content is sent, only the `lost_order_submit` flag.
- **Processing:** batch (daily). Tuning the session timeout is a settings decision made over weeks, and a single expired session does not need anyone to react within minutes.

### `api_latency_recorded`

- **Class / Category:** identified · Performance
- **Description:** Fires once for every API request the backend completes, measured in the request middleware so every endpoint is covered without per-endpoint code. High volume: see section 7 for sampling.
- **Golden rule:** We capture `api_latency_recorded` because we need to know which API endpoints are slowest, and at which clinics, which allows us to prioritise fixing the slowest endpoints first.

| Property      | Type    | Required | Allowlist | PII | Notes                                                                          |
| ------------- | ------- | -------- | --------- | --- | ------------------------------------------------------------------------------ |
| `endpoint`    | string  | yes      | yes       | no  | Route template, e.g. `/api/orders/{id}`. Never the real URL or query string    |
| `http_method` | string  | yes      | yes       | no  | `GET`, `POST`, `PUT`, `PATCH` or `DELETE`                                      |
| `status_code` | integer | yes      | yes       | no  | HTTP status returned, 100–599                                                  |
| `duration_ms` | integer | yes      | yes       | no  | Time from request received to response sent, in milliseconds, ≥ 0             |
| `clinic_id`   | string  | no       | yes       | no  | The user's clinic. Absent for requests without a logged-in user (e.g. login)   |
| `country`     | string  | no       | yes       | no  | `US` or `UK`. Absent together with `clinic_id`                                 |

- **PII / sanitisation:** No PII. Only the route template is sent, because a real path or query string can contain IDs or free text. Request and response bodies and headers (which carry tokens) are never captured. The user is identified only by the pseudonymised `userId` in the envelope.
- **Processing:** batch (daily). Choosing which endpoints to optimise is a planning decision made over days or weeks. Real-time outage alerting belongs to infrastructure monitoring, which is out of scope (see section 8).

### `page_load_recorded`

- **Class / Category:** identified · Performance
- **Description:** Fires once, from the frontend, each time a backoffice screen finishes loading and becomes usable. It measures what the user waits for in the browser, separately from server time in `api_latency_recorded`. High volume: see section 7 for sampling.
- **Golden rule:** We capture `page_load_recorded` because we need to know which backoffice screens load slowly in the browser, separately from slow APIs, which allows us to optimise the slowest screens first.

| Property    | Type    | Required | Allowlist | PII | Notes                                                                                   |
| ----------- | ------- | -------- | --------- | --- | --------------------------------------------------------------------------------------- |
| `screen`    | string  | yes      | yes       | no  | Route template, e.g. `/inventory/orders/new`. Never the real URL or query string        |
| `load_type` | string  | yes      | yes       | no  | `full` (first page load in the browser) or `in_app` (switching screens inside the app)  |
| `load_ms`   | integer | yes      | yes       | no  | Time until the screen is usable, in milliseconds, ≥ 0                                   |
| `clinic_id` | string  | no       | yes       | no  | The user's clinic. Absent on the login screen, before anyone is logged in               |
| `country`   | string  | no       | yes       | no  | `US` or `UK`. Absent together with `clinic_id`                                          |

- **PII / sanitisation:** No PII. Only the route template is sent. No browser fingerprint (browser version, screen size, IP address) is captured, because the decision does not need it. The user is identified only by the pseudonymised `userId` in the envelope.
- **Processing:** batch (daily). Choosing which screens to optimise is a planning decision made over days or weeks.

### `frontend_error_caught`

- **Class / Category:** identified · Errors
- **Description:** Fires once, from the frontend, when the browser's global error handler catches an error that no code handled (a crash or a broken screen).
- **Golden rule:** We capture `frontend_error_caught` because we need to know which uncaught browser errors happen and how many clinics they affect, which allows us to fix first the errors that affect the most clinics.

| Property            | Type   | Required | Allowlist | PII | Notes                                                                                     |
| ------------------- | ------ | -------- | --------- | --- | ----------------------------------------------------------------------------------------- |
| `error_type`        | string | yes      | yes       | no  | Error class name only, e.g. `TypeError`, `NetworkError`                                   |
| `error_fingerprint` | string | yes      | yes       | no  | 16-character hex hash of the normalised stack trace; identical errors share it            |
| `source`            | string | yes      | yes       | no  | `window_error`, `unhandled_rejection` or `error_boundary` (which handler caught it)       |
| `screen`            | string | yes      | yes       | no  | Route template where it happened, e.g. `/inventory/orders/new`                            |
| `app_version`       | string | yes      | yes       | no  | Frontend release, semver e.g. `2.4.1`. Shows whether an error stops after a fix ships     |
| `clinic_id`         | string | no       | yes       | no  | The user's clinic. Absent on the login screen, before anyone is logged in                 |
| `country`           | string | no       | yes       | no  | `US` or `UK`. Absent together with `clinic_id`                                            |

- **PII / sanitisation:** No PII. The error message and the stack trace are never sent, because messages often contain data shown on screen, which could include PHI. Only the class name and a fingerprint hash are sent, which is enough to group and count errors. Full debugging detail belongs to a dedicated error-tracking tool with scrubbing, which is out of scope (see section 8).
- **Processing:** batch (daily). Deciding which errors to fix first is a prioritisation decision made over days. Floods of the same error are handled in section 7.

### `section_viewed`

- **Class / Category:** identified · Navigation
- **Description:** Fires once, from the frontend, when a logged-in user enters a backoffice section. It does not fire on re-renders or on actions inside the section.
- **Golden rule:** We capture `section_viewed` because we need to know which backoffice sections staff use most and least, which allows us to decide which sections to improve, simplify or retire.

| Property           | Type   | Required | Allowlist | PII | Notes                                                                                      |
| ------------------ | ------ | -------- | --------- | --- | ------------------------------------------------------------------------------------------ |
| `section`          | string | yes      | yes       | no  | Section name in snake_case, e.g. `inventory`, `inbound_orders`, `reports`                  |
| `previous_section` | string | no       | yes       | no  | Section the user came from, same format. Absent on the first section after login           |
| `clinic_id`        | string | yes      | yes       | no  | Format `<country>-<region>-<nn>`, e.g. `us-tx-01`, `uk-lon-01`                             |
| `country`          | string | yes      | yes       | no  | `US` or `UK`                                                                               |

- **PII / sanitisation:** No PII. Only section names are sent, taken from the frontend's route configuration and restricted to snake_case, so no URL, free text or screen content can be included. The user is identified only by the pseudonymised `userId` in the envelope.
- **Processing:** batch (daily). Deciding which sections to improve, simplify or retire is a product decision made over weeks.

### `order_form_abandoned`

- **Class / Category:** identified · Navigation
- **Description:** Fires once, from the frontend, when a user who opened an inbound or outbound order form leaves it without a successful submission (navigates away, closes the tab, or the session expires). On tab close the event is sent with the browser's beacon API so it is not lost.
- **Golden rule:** We capture `order_form_abandoned` because we need to know where staff give up on inbound and outbound order forms without submitting them, which allows us to simplify the forms where staff give up most.

| Property               | Type    | Required | Allowlist | PII | Notes                                                                                        |
| ---------------------- | ------- | -------- | --------- | --- | -------------------------------------------------------------------------------------------- |
| `order_type`           | string  | yes      | yes       | no  | `inbound` or `outbound`                                                                      |
| `exit_reason`          | string  | yes      | yes       | no  | `navigated_away`, `tab_closed` or `session_expired`                                          |
| `fields_completed`     | integer | yes      | yes       | no  | Number of form fields filled in before leaving, ≥ 0                                          |
| `last_field`           | string  | no       | yes       | no  | Last field the user touched: `product_id`, `quantity`, `vendor_id` or `department`. Absent if none |
| `had_validation_error` | boolean | yes      | yes       | no  | `true` if the user left after a rejected submission (`order_validation_failed`)              |
| `time_on_form_seconds` | integer | yes      | yes       | no  | Seconds between opening the form and leaving it, ≥ 0                                         |
| `clinic_id`            | string  | yes      | yes       | no  | Format `<country>-<region>-<nn>`, e.g. `us-tx-01`, `uk-lon-01`                               |
| `country`              | string  | yes      | yes       | no  | `US` or `UK`                                                                                 |

- **PII / sanitisation:** No PII. Only field names and counts are sent, never the values typed into the form, which could contain anything. The user is identified only by the pseudonymised `userId` in the envelope.
- **Processing:** batch (daily). Simplifying order forms is a product decision made over weeks.

## 7. High-frequency strategy

Rules that stop repeated or very frequent events from flooding alerts or storage.

### `stock_threshold_triggered`: debounce

- **Problem:** stock that hovers around the minimum (small restock, then consumption) crosses it again and again, sending Clinical Operations several alerts for the same shortage.
- **Rule:** debounce by `clinic_id` + `product_id` with a 15-minute window. The first event is emitted; later events with the same key inside the window are dropped.
- **Not suppressed:** a different product, or the same product at another clinic, always fires.
- **Why it's safe:** the first alert has already triggered the restock decision; repeats within 15 minutes add no new information.

### `login_failed`: alert rule for repeated failures

- **No events are dropped:** every failed attempt is stored, because it may be needed as evidence in a security review. Only the alerts are limited.
- **Alert 1, one account under attack:** when `consecutive_failures` reaches 5 for the same `userId`, alert Claire (compliance) so the account can be locked or reset.
- **Alert 2, username guessing:** when 20 or more events with `account_known = false` arrive across the network within 10 minutes, alert Claire. This is network-wide because `clinic_id` is not sent for unknown accounts.
- **Alert limit:** at most one alert per account (alert 1) or one network-wide alert (alert 2) every 15 minutes, so an ongoing attack does not flood Claire.
- **Why these numbers:** one or two typos are normal; five failures in a row, or a burst of unknown usernames, is the pattern that needs action within minutes.

### `direct_stock_edit_rejected`: alert rule for bursts by the same user

- **No events are dropped:** every attempt is stored and processed in the daily batch, because the training and permissions decision is based on totals per clinic.
- **Rule:** the backend guard that rejects the edit also counts rejections per `userId`. When the same user reaches 5 rejected attempts within 10 minutes, the guard sends one alert to Claire (compliance). The events themselves still go to the daily batch.
- **Alert limit:** at most one alert per user every 60 minutes.
- **Why:** a single attempt is usually a staff member who does not know the order process. Repeated attempts in a short time, especially with `attempt_source = api`, look like someone deliberately trying to get around traceability, which compliance should know about the same day.

### High-volume events: sampling and dedupe

These events can fire many times per user per hour. Each rule keeps the data needed for its decision while cutting volume. The frontend events (`page_load_recorded`, `frontend_error_caught`, `section_viewed`) are queued in the browser and sent together every 30 seconds, and on tab close with the beacon API, so they do not add one network request each.

| Event                   | Rule                                                                                                                                         | Why it is safe                                                                                                                       |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `api_latency_recorded`  | Random 10% sample of requests, decided per `requestId`. Health-check routes (e.g. `/api/health`) are never recorded.                          | A uniform random sample keeps latency percentiles per endpoint accurate. Counts are multiplied by 10. Health checks are not user traffic. |
| `page_load_recorded`    | No sampling. All loads are recorded.                                                                                                         | Volume is low (one event per screen a user opens) and slow screens may be rare, so sampling could hide them.                           |
| `frontend_error_caught` | Dedupe: at most one event per `error_fingerprint` per `sessionId` every 5 minutes.                                                           | An error inside a render loop can fire thousands of times. The decision needs how many clinics and sessions are affected, not how many times one browser repeated it. |
| `section_viewed`        | No sampling. Fires only when the section changes, so a refresh or re-entering the same section in a row is not counted again.               | Volume is already low, and usage counts per clinic must be exact to decide which sections to retire.                                  |

## 8. Risks and exclusions

_Events considered and discarded, and data that will not be captured (PHI, credentials, out-of-scope infrastructure)._
