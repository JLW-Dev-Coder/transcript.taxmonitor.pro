# Transcript Tax Monitor (TTM)

## Table of Contents

* Overview
* Key Features
* Architecture Overview
* Ecosystem Integration
* Repository Structure
* Environment Setup
* Deployment
* Contracts or Data Model
* Development Standards
* Integrations
* Security and Secrets
* Contribution Guidelines
* License

---

# Transcript Tax Monitor

Transcript Tax Monitor (TTM) provides **automated IRS transcript diagnostics and analysis services** within the Tax Monitor ecosystem.

The system allows taxpayers and tax professionals to run structured analysis against IRS transcript data to detect patterns such as:

* collection activity indicators
* filing gaps
* account balance signals
* enforcement risk patterns

The platform is built using a **contract-driven architecture** and operates through **Cloudflare Workers with R2 as canonical storage**, consistent with the architecture used across the ecosystem infrastructure. 

Transcript processing is executed through **token-based access**, ensuring that analysis resources are allocated through controlled execution.

---

# 1. Overview

Transcript Tax Monitor exists to provide **structured transcript interpretation and diagnostics**.

Many taxpayers and professionals can obtain transcripts but lack tooling to interpret them effectively. This system bridges that gap by transforming transcript data into structured diagnostic insights.

The system supports:

* transcript job creation
* automated transcript analysis
* result retrieval and reporting
* token-verified execution

Transcript analysis acts as a **technical diagnostic layer** that often precedes professional engagement through the ecosystem directory.

---

# 2. Key Features

Major capabilities include:

* automated transcript analysis
* contract-validated API requests
* transcript job processing
* structured analysis results
* token-based transcript execution
* R2-based canonical storage
* Worker-based execution pipeline

The system focuses on diagnostics and insight rather than tax advice or representation.

---

# 3. Architecture Overview

Transcript Tax Monitor follows the **worker-centric architecture model used across the ecosystem**.

Core architectural principles include:

* contract-driven APIs
* stateless Worker execution
* canonical data storage in R2
* token-verified tool execution
* deny-by-default routing

Primary system components:

| Component            | Role                                             |
| -------------------- | ------------------------------------------------ |
| Cloudflare Workers   | execute transcript analysis API logic            |
| R2 Storage           | canonical storage of transcript jobs and results |
| Token APIs           | verify transcript tokens before execution        |
| Static Web Interface | transcript submission and result viewing         |

All write operations are validated through API contracts before canonical storage updates occur.

---

# 4. Ecosystem Integration

Transcript Tax Monitor is one of four interconnected platforms that form the broader ecosystem.

| Platform               | Role                                          |
| ---------------------- | --------------------------------------------- |
| Tax Monitor Pro        | taxpayer discovery and professional directory |
| Tax Tools Arcade       | interactive tax education tools               |
| Transcript Tax Monitor | transcript diagnostics and analysis           |
| Virtual Launch Pro     | professional infrastructure and memberships   |

These platforms interact through Cloudflare Worker APIs while maintaining separate responsibilities.

Typical ecosystem flow:

```
Tax Tools Arcade
→ attracts discovery traffic

Transcript Tax Monitor
→ performs transcript diagnostics

Tax Monitor Pro
→ connects taxpayers with professionals

Virtual Launch Pro
→ manages professional infrastructure
```

Virtual Launch Pro acts as the **infrastructure layer for membership systems and professional services across the ecosystem**. 

---

# 5. Repository Structure

Typical repository structure:

```
/app
/assets
/contracts
/pages
/partials
/site
/workers
```

Directory descriptions:

| Directory    | Purpose                              |
| ------------ | ------------------------------------ |
| `/app`       | authenticated application interfaces |
| `/assets`    | shared media and visual assets       |
| `/contracts` | JSON API contracts                   |
| `/pages`     | onboarding and workflow pages        |
| `/partials`  | reusable UI components               |
| `/site`      | public marketing pages               |
| `/workers`   | Cloudflare Worker APIs               |

Worker APIs implement transcript job processing and results retrieval.

---

# 6. Environment Setup

Required software:

* Git
* Node.js
* Wrangler CLI

Typical setup process:

```
git clone <repository>
npm install
wrangler dev
```

Development environments should mirror production configuration where possible.

---

# 7. Deployment

Deployment is performed using **Cloudflare Workers**.

Deployment command:

```
wrangler deploy
```

Worker configuration is defined in `wrangler.toml` and includes:

* compatibility date
* R2 bucket bindings
* environment variables
* Worker route mappings

---

# 8. Contracts or Data Model

Transcript Tax Monitor uses **contract-driven API validation**.

Each request must match a defined contract before execution.

Typical request pipeline:

```
1 request received
2 contract validation
3 transcript job created
4 canonical record stored in R2
5 analysis executed
6 result stored in R2
7 response returned
```

---

## Canonical Storage (R2)

Transcript canonical objects are stored using structured paths.

```
/r2/transcript_jobs/{job_id}.json
/r2/transcript_results/{result_id}.json
```

---

## Example Transcript Job

```
{
  "job_id": "job_39284",
  "account_id": "acct_1042",
  "status": "processing",
  "created_at": "2026-03-13T18:00:00Z"
}
```

---

## Example Transcript Result

```
{
  "result_id": "res_9821",
  "job_id": "job_39284",
  "analysis_complete": true,
  "issues_detected": [
    "collection_activity",
    "potential_unfiled_return"
  ]
}
```

---

# Worker Routes

### Transcript Jobs

```
GET  /v1/transcripts/jobs/{job_id}
POST /v1/transcripts/analyze
```

Purpose:

* create transcript analysis jobs
* retrieve job status

---

### Transcript Results

```
GET /v1/transcripts/results/{result_id}
```

Purpose:

* retrieve transcript analysis results

---

### Token Verification

Transcript analysis requires tokens.

```
GET /vlp/v1/tokens/{account_id}/transcripts
```

Purpose:

* verify transcript token balances
* authorize analysis execution

---

# 9. Development Standards

Development standards include:

* alphabetical route documentation
* contract-first API design
* canonical Worker header comments
* deny-by-default routing

These standards maintain consistency across Workers and services within the ecosystem.

---

# 10. Integrations

External integrations include:

* Cloudflare Workers
* Cloudflare R2
* Virtual Launch Pro token APIs

Token verification must occur before transcript analysis begins.

---

# 11. Security and Secrets

Secrets must be managed using Wrangler.

Example:

```
wrangler secret put SECRET_NAME
```

Secrets include:

* API keys
* service tokens
* webhook secrets

Secrets must never be committed to source control.

---

# 12. Contribution Guidelines

Recommended workflow:

1. create a feature branch
2. implement changes
3. test locally
4. submit pull request

Changes should preserve:

* contract compatibility
* API route stability
* canonical storage structure

---

# 13. License

This repository is proprietary software maintained as part of the Tax Monitor ecosystem.

Unauthorized redistribution is not permitted.
