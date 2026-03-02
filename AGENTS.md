# AGENTS.md — Transcript.TaxMonitor.Pro

## Purpose
This repository powers:
https://transcript.taxmonitor.pro

It is a static content + marketing site.
Revenue impact depends on routing stability and build correctness.

Agents must prioritize:
- Correct build output
- Route integrity
- Minimal changes

---

# Build Rules

Primary output directory:
dist/

All routable content must be present in dist.

Required folders (if present in source):
- assets/
- legal/
- magnets/
- scripts/
- styles/
- _sdk/
- _redirects

Never:
- Allow a catch-all redirect to override real static pages unintentionally
- Emit only index.html when multiple pages exist

---

# Routing Rules

If using Cloudflare Pages-style _redirects:

- Catch-all rules must not swallow real file paths
- Static files must take precedence over SPA fallback
- Real HTML pages must remain directly routable

---

# Asset Rules

Any file referenced in:
- HTML
- CSS
- JS

Must:
- Exist in source
- Exist in dist after build

Missing referenced files are BLOCKERS.

---

# Modification Rules

Agents must:
- Avoid redesigning layout
- Avoid renaming files
- Avoid moving directories unless fixing a routing bug
- Avoid introducing new frameworks or bundlers

When fixing:
- Modify only build logic if dist coverage is incomplete
- Keep changes minimal
- Do not alter marketing copy

---

# Launch Blockers

- Source HTML page missing from dist
- Referenced file missing
- Routing config swallowing real pages
- Build failure
- Broken internal links

Warnings:
- Unused assets
- Minor duplication
- SEO enhancements not affecting routing

---

# Non-Goals

Do NOT:
- Convert to React/Vue/Next/etc
- Introduce TypeScript
- Replace build system
- Change domain structure
- Alter content tone

---

# Philosophy

This site must:
- Build predictably
- Deploy predictably
- Route predictably

Predictable > clever.
Stable > modern.
Working > optimized.
