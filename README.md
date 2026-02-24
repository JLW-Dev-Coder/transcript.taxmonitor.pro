# transcript.taxmonitor.pro

Public marketing + transcript parsing UI for Tax Monitor Pro.

This repository contains only static Pages UI.

It does NOT contain:
- Worker logic
- R2 storage
- ClickUp integrations
- Canonical contracts

---

# Architecture Separation

## Worker + Canonical Contracts (Authoritative)

Remain in:

\OneDrive\taxmonitor.pro-site\workers\api\src\index.js
\OneDrive\taxmonitor.pro-site\app\contracts\

Worker runs on:
https://api.taxmonitor.pro

Worker responsibilities:
- Validate contracts
- Append receipts
- Write canonical R2 objects
- Project to ClickUp
- Send outbound email after canonical write

R2 is authoritative.
Worker enforces lifecycle.
No direct ClickUp writes from UI.

---

## Presentation Layer (This Repo)

This repository powers:
https://transcript.taxmonitor.pro

It is:
- Static Cloudflare Pages site
- Pure UI
- No server logic
- No R2 authority

All forms POST to:
https://api.taxmonitor.pro/forms/...

There is only ONE API host.

---

# Folder Structure

transcript.taxmonitor.pro/
│
├── index.html
├── view-product.html
├── pricing.html
├── contact.html
├── report.html
├── _redirects
│
├── assets/
│
├── styles/
│   └── site.css
│
└── scripts/
    ├── chat-widget.js
    └── report-renderer.js

This repo contains:
- Layout
- Parser UI
- Chat widget
- Cal.com embed
- Shareable report rendering

It does NOT contain:
- Contracts
- Worker code
- R2 logic
- Stripe validation

---

# Page Responsibilities

## index.html
Landing + parser UI.
Includes:
- Transcript parser
- Logo upload field
- CTA to pricing
- ScriptBot widget

## view-product.html
Explains:
- What the parser does
- Why tax pros need it
- Sample report preview

## pricing.html
Displays:
- Single unlock
- Future Pro tier
- Stripe integration (future)

## contact.html
Contains:
- Cal inline embed
- Chat widget
- Support layout

## report.html
Client-facing shareable report page.

Behavior:
- Reads reportId from query string
- Calls Worker:
  GET https://api.taxmonitor.pro/app/report/{reportId}
- Renders returned JSON dynamically

---

# Shareable Report Security

Secure if:
- reportId is UUID v4
- No listing endpoint
- Worker validates reportId
- Report stored in R2:
  reports/{reportId}.json

Optional:
- Signed URL with expiration
- Token-based access

Current design is sufficient for transcript summaries.

---

# Important Rules

Do NOT:
- Duplicate Worker here
- Duplicate contracts here
- Create second API host
- Write directly to ClickUp from UI
- Write directly to R2 from UI

All mutations must go through:
https://api.taxmonitor.pro

Worker remains authoritative.

---

# Design Philosophy

- Presentation layer is disposable.
- Worker + contracts are canonical.
- R2 is authority.
- ClickUp is projection.
- Email is outbound-only after canonical write.

