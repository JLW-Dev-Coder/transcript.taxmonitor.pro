# Transcript.Tax Monitor Pro

**Serverless · Contract-Driven · Idempotent · Event-Driven · R2-Authoritative**

---

## Table of Contents (Alphabetical)

* Authentication Model
* ClickUp Projection Layer
* Contracts (Mutation Ingress Only)
* Core Stack
* Data Model (R2 Canonical Authority)
* Domains & Routing
* Event Trigger System
* Idempotency & Safety
* Lifecycle State Model (Order StepBooleans)
* Operational Checklist
* Payloads (Stripe, Transcript Report, Cal Support)
* Processing Contract (Write Order)
* Read Models (Worker GET Endpoints)
* Report Rendering Contract
* Repository Structure (Exact Tree)
* Security & Legal Controls
* Stripe Payments (Payment Links + Confirmation Redirect)
* System Architecture
* What Transcript.Tax Monitor Pro Is
* Worker Environment Variables

---

# What Transcript.Tax Monitor Pro Is

Transcript.Tax Monitor Pro is a **serverless CRM + delivery system for IRS transcript monitoring and structured report generation**.

It is:

* Contract-driven
* Event-driven
* Idempotent
* R2-authoritative
* Worker-orchestrated

HTML never defines valid data. JSON contracts define valid data.

---

# System Architecture

## Presentation Layer

Cloudflare Pages serves:

* `/` (marketing + product)
* `/assets/*` (product pages + report UI)
* `/magnets/*` (lead magnets)

UI never mutates canonical state directly. All mutations go through Worker endpoints.

---

## Logic Layer

Cloudflare Worker (`api.taxmonitor.pro`):

* Validates inbound events
* Writes append-only receipts
* Upserts canonical state
* Enforces lifecycle gating
* Projects to ClickUp
* Sends email (after canonical update only)
* Serves read-only GET endpoints

---

## Storage Layer

Cloudflare R2:

* Canonical objects (mutable state)
* Append-only receipt ledger (immutable)
* Generated artifacts (reports, PDFs)

R2 is authority. Nothing else is authoritative.

---

## Execution Layer

ClickUp:

* Accounts list
* Orders list
* Support list
* Transcripts list (credit tracking + report projection)

ClickUp is projection only. Worker writes to R2 first, then projects.

---

# Domains & Routing

## UI Domain

```
https://transcript.taxmonitor.pro
```

Serves:

* `/assets/*`
* `/magnets/*`
* `/` (marketing + product)

---

## API Domain

```
https://api.taxmonitor.pro
```

Worker route:

```
api.taxmonitor.pro/*
```

Rules:

* All forms must POST absolute URLs
* No relative form actions
* No UI → ClickUp direct calls
* No UI → Stripe direct calls
* No SMTP ever

---

# Event Trigger System

## Final Trigger Set (Alphabetical)

* Appt
* Email
* Form
* Login
* Message
* Payment
* Task
* Visit

## Trigger Sources

Appt → Cal webhook
Email → Google Workspace (post-canonical only)
Form → Portal + staff submissions
Login → Auth endpoints
Message → In-app + logged outbound
Payment → Stripe webhook
Task → ClickUp webhook
Visit → Client-side beacon (logged, not client-visible)

---

# Processing Contract (Write Order)

For every inbound mutation event:

1. Validate signature (if webhook)
2. Validate payload against JSON contract
3. Append receipt (immutable)
4. Upsert canonical object
5. Project to ClickUp
6. Send email (if required)

If receipt exists → exit safely.

Receipt append always precedes canonical mutation.

Payment Links are treated as:

* UI redirect only (no mutation)
* Stripe webhook is the mutation source of truth

---

# Data Model (R2 Canonical Authority)

```
accounts/{accountId}.json
orders/{orderId}.json
receipts/{source}/{eventId}.json
reports/{reportId}.json
support/{supportId}.json
transcripts/{transcriptId}.json
```

Notes:

* `receipts/*` is the immutable ledger.
* `accounts/*` holds credit balance.
* `orders/*` holds each Stripe purchase (one per successful payment event).
* `reports/*` is the authoritative render model for UI download/preview.
* `transcripts/*` stores parsed transcript data (source + normalized output).
* `support/*` stores Cal bookings and status changes.

Receipts are immutable ledger entries. Canonical objects are mutable state. Reports are authoritative render models.

---

# Lifecycle State Model (Order StepBooleans)

Each order tracks progression via strict booleans:

```
intakeComplete
offerAccepted
agreementAccepted
paymentCompleted
welcomeConfirmed
filingStatusSubmitted
addressUpdateSubmitted
reportReady
```

Worker enforces:

* No forward step without prior completion
* No projection before canonical update
* No report rendering unless `reportReady = true`

---

# Report Rendering Contract

Report rendering follows strict priority:

1. `orders` object (primary)
2. `accounts` object (secondary)

For transcript download flow:

* A credit is consumed only after successful R2 persistence of `reports/{reportId}.json`
* Rendering always loads by `reportId`
* Preview mode never mutates state

If `reportReady = false`:

* Render placeholders
* Do not render compliance artifacts

Rendering logic never infers state from UI.

---

# Read Models (Worker GET Endpoints)

Read models:

* Do not append receipts
* Do not mutate canonical R2
* Do not project to ClickUp
* Are not included in contract-registry.json

Examples:

```
GET /app/payments
GET /app/reports/{reportId}
```

Purpose:

Return canonical R2-derived data for rendering only.

Read models are documented here, not registered as mutation contracts.

---

# Contracts (Mutation Ingress Only)

Registry file:

```
app/contracts/contract-registry.json
```

Contracts exist only when:

* Endpoint receives POST
* Worker appends receipt
* Worker mutates canonical R2
* Worker updates lifecycle state
* Worker triggers ClickUp projection

Validation rules:

* enumStrict = true
* normalizeCheckboxToBoolean = true
* rejectUnknownValues = true
* No hardcoded dropdown enums in HTML
* No business logic inferred from UI

---

# ClickUp Projection Layer

ClickUp is projection only. R2 is the only authority.

## Lists

* Account — 901710909567
* Orders — 901710818340
* Support — 901710818377
* Transcripts — 901711373249

## Task Model

All tasks link to the account via the **Account ID** custom field ([https://api.clickup.com/api/v2/task/{task_id}/link/{links_to](https://api.clickup.com/api/v2/task/{task_id}/link/{links_to)}).

* `accounts/{accountId}.json` → upsert one task per `accountId` in **Account** list
* `orders/{orderId}.json` → upsert one task per `orderId` in **Orders** list
* `support/{supportId}.json` → upsert one task per `supportId` in **Support** list
* `transcripts/{transcriptId}.json` → upsert one task per `accountId` in **Transcripts** list (credit + latest report)

## Custom Fields (Authoritative Set)

### Account fields

* Account Company Name — `059a571b-aa5d-41b4-ae12-3681b451b474`
* Account Event ID — `33ea9fbb-0743-483a-91e4-450ce3bfb0a7`
* Account Full Name — `b65231cc-4a10-4a38-9d90-1f1c167a4060`
* Account ID — `e5f176ba-82c8-47d8-b3b1-0716d075f43f`
* Account Primary Email — `a105f99e-b33d-4d12-bb24-f7c827ec761a`
* Account Transcript Credits — `f938260c-600d-405a-bee7-a8db5d09bf6d`

### Order fields

* Order Event ID — `77197d46-559d-43c1-9dfc-5123ce2a02f1`
* Order Payment Intent ID — `6fc65cba-9060-4d70-ab36-02b239dd4718`
* Stripe Customer ID — `a5e09a6a-5c14-4efe-86a7-3f76fa7739e6`
* Stripe Order Receipt URL — `f8cb77f1-26b3-4788-83ed-2914bb608c11`
* Stripe Payment Status — `1b9a762e-cf3e-47d7-8ae7-98efe9e11eab`
* Stripe Payment URL — `0609cd0b-dd5e-4523-a21f-c4df8e9da4db`
* Stripe Session ID — 57e6c42b-a471-4316-92dc-23ce0f59d8b4

### Transcript fields

* Transcript Event ID — `73570eb4-1908-4950-91d2-8cdd42dd4bc2`
* Transcript Report ID — `5250265e-b9cc-4c13-8693-718b28d9d0e2`

### Support fields (latest Cal booking event)

* Support Event ID — `8e8b453e-01f3-40fe-8156-2e9d9633ebd6`

## Projection Rules

* Worker never reads ClickUp to decide canonical state.
* Worker always writes: receipt → canonical R2 → ClickUp projection.
* Credit balance is projected from `accounts/{accountId}.json`.

## Comments (Audit Trail)

Add one ClickUp comment per credit mutation:

* Purchase: `+{credits} credits (Stripe session {stripeSessionId})`
* Consumption: `-{creditsUsed} credit (Report {reportId})`

ClickUp is never authoritative.

---

# Idempotency & Safety

* Every event includes `eventId`
* Stripe dedupe key = Stripe Checkout Session ID (from Payment Links)
* Receipt written before canonical change
* No duplicate credits
* No duplicate emails
* Retry-safe processing

ClickUp projection must be idempotent:

* Upsert the same task for the same `accountId`
* Avoid duplicate comments by using a deterministic comment fingerprint (stored in canonical state)

---

# Stripe Payments (Payment Links + Confirmation Redirect)

Transcript.Tax Monitor Pro uses **Stripe Payment Links** for credit pack purchases.

## Payment Links

### Live links (authoritative)

* 10 credits

  * Billing link: `https://billing.taxmonitor.pro/b/4gM8wOaAe1oKcUEdTkaR203`
  * Payment Link ID: `plink_1T4QbWCMpIgwe61Zo0VGAWjd`
* 25 credits

  * Billing link: `https://billing.taxmonitor.pro/b/cNi14m5fU3wS1bW9D4aR204`
  * Payment Link ID: `plink_1T4QoqCMpIgwe61Zp7aAL4lJ`
* 100 credits

  * Billing link: `https://billing.taxmonitor.pro/b/dRm8wO7o27N83k47uWaR205`
  * Payment Link ID: `plink_1T4QpbCMpIgwe61ZJ5m5HltC`

Rules:

* UI never calls Stripe APIs directly
* Success redirect must go to the site confirmation page
* Credits are granted only by Stripe webhook processing (not by the redirect)

### Success redirect

Stripe Payment Link “Confirmation page” must be set to:

```
https://transcript.taxmonitor.pro/payment-confirmation.html
```

### Redirect mapping (Cloudflare Pages)

`_redirects` must include:

```
/payment-confirmation.html /assets/confirmation.html 302
```

### Cancel URL

Set cancel URL to:

```
https://transcript.taxmonitor.pro/assets/product.html
```

## Confirmation Page

`/assets/confirmation.html` is UI-only.

It may:

* Display purchase success messaging
* Read `session_id` from the querystring (when provided)
* Poll a read model endpoint to show “credits applied” status

It must not:

* Grant credits
* Mutate canonical state

## Webhook Source of Truth

Credits are granted by a Stripe webhook handler that:

1. Validates Stripe signature
2. Appends receipt to R2 (`receipts/stripe/{eventId}.json`)
3. Upserts canonical credit balance/state
4. Optionally projects to ClickUp

---

# Core Stack (Alphabetical)

* Cal.com — Appointment webhooks
* ClickUp — Projection layer
* Cloudflare Pages — UI hosting
* Cloudflare R2 — Canonical storage + artifacts
* Cloudflare Worker — API orchestration
* Google Workspace — Transactional email (only permitted system)
* Stripe — Payment webhooks

---

# Worker Environment Variables

## Secrets

* CAL_WEBHOOK_SECRET
* CLICKUP_API_KEY
* GOOGLE_PRIVATE_KEY
* STRIPE_SECRET_KEY
* STRIPE_WEBHOOK_SECRET

## Plaintext

* BILLING_LINK_10
* BILLING_LINK_100
* BILLING_LINK_25
* CLICKUP_ACCOUNTS_LIST_ID
* CLICKUP_ORDERS_LIST_ID
* CLICKUP_SUPPORT_LIST_ID
* CLICKUP_TRANSCRIPTS_LIST_ID
* CREDIT_MAP_JSON
* GOOGLE_CLIENT_EMAIL
* GOOGLE_TOKEN_URI
* GOOGLE_WORKSPACE_USER_INFO
* GOOGLE_WORKSPACE_USER_NO_REPLY
* GOOGLE_WORKSPACE_USER_SUPPORT
* MY_ORGANIZATION_ADDRESS
* MY_ORGANIZATION_BUSINESS_LOGO
* MY_ORGANIZATION_CITY
* MY_ORGANIZATION_NAME
* MY_ORGANIZATION_STATE_PROVINCE
* MY_ORGANIZATION_ZIP
* PRICE_10
* PRICE_100
* PRICE_25
* PRICE_LINK_10
* PRICE_LINK_100
* PRICE_LINK_25
* TRANSCRIPT_RETURN_ORIGINS_JSON

### Transcript pricing/token vars (from wrangler.toml)

```toml
CREDIT_MAP_JSON = "{\"price_1T4Ar2CMpIgwe61ZMzAI6yKa\":10,\"price_1T4AxzCMpIgwe61ZsWh7GGAb\":25,\"price_1T4B1gCMpIgwe61ZG12b5tjN\":100}"
PRICE_10 = "price_1T4Ar2CMpIgwe61ZMzAI6yKa"
PRICE_25 = "price_1T4AxzCMpIgwe61ZsWh7GGAb"
PRICE_100 = "price_1T4B1gCMpIgwe61ZG12b5tjN"
TRANSCRIPT_RETURN_ORIGINS_JSON = "[\"https://transcript.taxmonitor.pro\"]"
```

---

# Payloads (Stripe, Transcript Report, Cal Support)

This section documents the inbound payload shapes the Worker must accept.

## Stripe (checkout.session.completed)

Event source: Stripe webhook.

Minimum fields used:

* `id` (event id) → receipt + Account Event ID CF
* `data.object.id`  → Stripe Session ID CF (dedupe key)
* `data.object.customer_details.name` → Account Full Name CF
* `data.object.customer_details.email` → Account Primary Email CF
* `data.object.customer_details.business_name` → Account Company Name CF
* `data.object.status` → Stripe Payment Status CF
* `data.object.payment_link` → Stripe Payment URL CF
* `data.object.payment_intent` → Order Payment Intent ID CF

Example (trimmed):

```json
{
  "id": "evt_1SzncbCMpIgwe61ZklDYVjgV",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_live_a15vr7buckd0jG38Vzsuf7QObOwGanLb20JXqw7CZLeDve32AatnSY7TaY",
      "status": "complete",
      "payment_status": "paid",
      "payment_intent": "pi_3SzncZCMpIgwe61Z0ro4Ruxv",
      "payment_link": "plink_1SznXhCMpIgwe61ZUclAKXCj",
      "customer_details": {
        "name": "Jamie L Williams",
        "email": "jamie.williams@virtuallaunch.pro",
        "business_name": null
      }
    }
  }
}
```

Canonical effects:

* Create account (if new)
* Create order (one per successful purchase)
* Increase `accounts/{accountId}.transcriptCredits`

## Stripe (payment_intent.succeeded)

Event source: Stripe webhook.

Purpose:

* Confirms payment intent succeeded
* Links to Checkout Session + Charge by `payment_intent` id

Minimum fields used:

* `id` (event id) → Order Event ID CF
* `data.object.id` → Order Payment Intent ID CF
* `data.object.status` → Stripe Payment Status CF

Example (trimmed):

```json
{
  "id": "evt_3SzncZCMpIgwe61Z0XeE9DfJ",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_3SzncZCMpIgwe61Z0ro4Ruxv",
      "status": "succeeded",
      "latest_charge": "ch_3SzncZCMpIgwe61Z0faf2v3f"
    }
  }
}
```

## Stripe (charge.succeeded)

Event source: Stripe webhook.

Purpose:

* Supplies receipt URL for the order

Minimum fields used:

* `object.payment_intent` → Order Payment Intent ID CF
* `object.receipt_url` → Stripe Order Receipt URL CF
* `object.status` → Stripe Payment Status CF

Example (trimmed):

```json
{
  "object": {
    "id": "ch_3SzncZCMpIgwe61Z0faf2v3f",
    "object": "charge",
    "status": "succeeded",
    "payment_intent": "pi_3SzncZCMpIgwe61Z0ro4Ruxv",
    "receipt_url": "https://pay.stripe.com/receipts/payment/CAcQARoXChVhY2N0XzFSTmdtWENNcElnd2U2MVoo-bi0zAYyBnyGtbiKBjosFlkRUNJF8liaNSNl-GMQaxhh_fccQx5an3FCrTmIN6kgO6QtPRoXRJr3ZR8"
  }
}
```

## Cal.com (BOOKING_CREATED, BOOKING_CANCELLED, BOOKING_RESCHEDULED)

Event source: Cal webhook.

Minimum fields used:

* `triggerEvent`
* `payload.eventTypeId` (must match transcript support event type)
* `payload.uid` (booking UID)
* `payload.bookingId`
* `payload.status`
* `payload.responses.email.value` (or attendee email)

Canonical effects:

* Upsert `support/{supportId}.json`
* Project latest Support Event ID CF

## Transcript Report (Parsed IRS Transcript Data)

Event source: Transcript parse pipeline (mutation endpoint).

Not yet locked.

Expected minimum fields (draft):

* `eventId`
* `accountId`
* `reportId`
* `creditsUsed`
* `parsedAt`
* `taxYears[]`
* `transcriptCodes[]`

Canonical effects:

* Persist `transcripts/{transcriptId}.json`
* Persist `reports/{reportId}.json`
* Reduce `accounts/{accountId}.transcriptCredits` only after report persistence
* Project Transcript Report ID CF and Transcript Event ID CF

---

# Operational Checklist

* All forms POST absolute Worker URLs
* Every event includes `eventId`
* Receipt written before state change
* Canonical upsert before ClickUp update
* Emails sent only after canonical update
* Lifecycle booleans strictly enforced
* Login writes receipt
* Read models never mutate state

---

# Repository Structure (Exact Tree)

This structure is authoritative and must not be modified without updating this file.

```
.
├─ _redirects
├─ build.mjs
├─ index.html
├─ package-lock.json
├─ package.json
├─ postcss.config.js
├─ README.md
├─ tailwind.config.js
├─ assets/
│  ├─ confirmation.html
│  ├─ favicon.ico
│  ├─ logo.svg
│  ├─ product.html
│  ├─ report-preview.html
│  └─ report.html
├─ legal/
│  ├─ privacy.html
│  └─ terms.html
├─ magnets/
│  ├─ guide.html
│  └─ lead-magnet.html
├─ partials/
│  ├─ footer.html
│  └─ header.html
├─ scripts/
│  └─ report-renderer.js
├─ styles/
│  └─ site.css
└─ _sdk/
   └─ element_sdk.js
```

To complete Stripe credit granting (canonical + idempotent), this repo depends on Worker code that lives in **another repo**:

* `taxmonitor.pro-site/workers/api/wrangler.toml`
* `taxmonitor.pro-site/workers/api/src/index.js`

This repo still needs (deployment/config):

* R2 binding configuration (bucket + env vars)
* Stripe webhook secret as a Worker secret

---

# Security & Legal Controls

* Deny-by-default endpoints
* Webhook signature validation (Stripe + Cal)
* No secrets in client payloads
* No raw SSN logging
* PII masked in UI
* R2 is authority
* ClickUp is projection only

---

# Final Authority

R2 is authority.
Worker enforces contracts.
ClickUp is projection.
Registry governs mutation ingress only.
Read models are documented in README.

Architecture is locked.
