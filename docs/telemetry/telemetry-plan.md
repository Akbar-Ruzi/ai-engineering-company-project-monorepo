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

_The flow from authenticated access to inbound/outbound order completion, with at least 5 instrumentation points._

## 4. Broad opportunity catalogue

_Opportunities beyond inventory (authentication, performance, frontend errors, navigation), labeled mandatory or identified opportunity._

## 5. Event Envelope

_The mandatory fields every event carries._

## 6. Event catalog

_Every event: hypothesis → decision, property allowlist, PII notes, and stream/batch rationale._

## 7. High-frequency strategy

_Throttle and debounce rules for high-frequency events._

## 8. Risks and exclusions

_Events considered and discarded, and data that will not be captured (PHI, credentials, out-of-scope infrastructure)._
