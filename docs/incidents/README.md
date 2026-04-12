# Incident Reports (RCA)

This directory contains Root Cause Analysis (RCA) and post-mortem reports for service disruptions, deployment failures, security regressions, data-quality issues, and user-facing bugs in Cover Craft.

Incident reports are intentionally separate from ADRs:

- **ADRs** explain why an architectural decision was made.
- **RCAs** explain why something failed, how it was fixed, and what should prevent it from happening again.

---

## 📂 Incident Log

The incidents below were identified from past fix commits and documented as RCA records.

| RCA | Date | Title | Severity | Status | Suggested File | Related Commits |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **005** | 2026-04-08 | [Flex Consumption Deployment Configuration Failure](./005-flex-consumption-deployment-configuration-failure.md) | 🟡 Medium | ✅ Resolved | `005-flex-consumption-deployment-configuration-failure.md` | `610bc91`, `e95688c`, `20919b4` |
| **004** | 2026-02-27 | [Batch API Function Key Authentication Failure](./004-batch-api-function-key-authentication-failure.md) | 🟡 Medium | ✅ Resolved | `004-batch-api-function-key-authentication-failure.md` | `e454449` |
| **003** | 2026-02-05 | [WCAG Analytics Trend Normalization Failure](./003-wcag-analytics-trend-normalization-failure.md) | 🔵 Low | ✅ Resolved | `003-wcag-analytics-trend-normalization-failure.md` | `46fbbcc` |
| **002** | 2026-01-23 | [Azure Functions Monorepo Package Deployment Failure](./002-azure-functions-monorepo-package-deployment-failure.md) | 🟡 Medium | ✅ Resolved | `002-azure-functions-monorepo-package-deployment-failure.md` | `662eb51`, `0ac2078` |
| **001** | 2026-01-18 | [Cover Generation Binary Response Type Failure](./001-cover-generation-binary-response-type-failure.md) | 🟡 Medium | ✅ Resolved | `001-cover-generation-binary-response-type-failure.md` | `539e064` |

---

## 🛠️ Process & Standards

Incident documentation prevents repeat failures and turns debugging work into reusable engineering knowledge.

### ⚖️ When to write an RCA

Formal RCAs are useful when one or more of these conditions are met:

1. **Utility Loss:** Cover generation, batch generation, downloads, analytics, or deployment stops working.
2. **Data Integrity:** Metrics, generated image metadata, job records, or user-visible analytics become incorrect, incomplete, or misleading.
3. **Security Boundary:** Authentication, authorization, secrets handling, or deployment credentials fail open or fail closed in a way that affects the product.
4. **Deployment Reliability:** CI/CD, OpenTofu, Docker packaging, Azure Functions, or App Service deployment fails in a way that blocks release.
5. **Regression:** The same failure mode has happened before and the previous fix did not prevent recurrence.

Minor copy changes, isolated cosmetic defects, dependency bumps, or local-only configuration drift can stay in normal commit history unless they reveal a broader system weakness.

### Severity Levels

| Level | Meaning |
| :--- | :--- |
| **🔴 High** | Core product unavailable, data loss, secret exposure, or a security boundary is bypassed. |
| **🟡 Medium** | Partial product failure, blocked deployment, broken batch workflow, incorrect analytics, or degraded reliability. |
| **🔵 Low** | Minor user-facing bug, limited analytics inconsistency, local development issue, or non-critical workflow failure. |

### Status

| Status | Meaning |
| :--- | :--- |
| **🚧 Draft** | Incident is identified, but the RCA still needs to be written. |
| **🔎 Investigating** | Root cause is still being confirmed. |
| **🩹 Mitigated** | Temporary fix applied; permanent prevention is still pending. |
| **✅ Resolved** | Root cause identified, permanent fix implemented, and verification completed. |

### 📝 RCA Template

To document a new incident, create a new file named `XXX-descriptive-title.md`.

```markdown
# RCA [XXX]: [Descriptive Title]

- **Status:** Draft | Investigating | Mitigated | Resolved
- **Date:** YYYY-MM-DD
- **Severity:** High | Medium | Low
- **Author:** Victoria Cheng
- **Related Commits:** `hash`, `hash`

## Summary

A brief overview of what happened, who or what was affected, and the final outcome.

## Impact

- **User Impact:** What users could not do or what result was incorrect.
- **System Impact:** Which service, workflow, deployment, or data path failed.
- **Duration:** Known duration, or "Unknown" if it was discovered after the fact.

## Timeline

- **YYYY-MM-DD HH:MM UTC:** Incident detected.
- **YYYY-MM-DD HH:MM UTC:** Investigation started.
- **YYYY-MM-DD HH:MM UTC:** Mitigation applied.
- **YYYY-MM-DD HH:MM UTC:** Root cause identified.
- **YYYY-MM-DD HH:MM UTC:** Permanent fix deployed.

## Root Cause Analysis

Explain why the incident happened. Include the technical mismatch, bad assumption, missing test, missing validation, or deployment constraint that allowed the failure.

## Resolution

Describe the code, configuration, infrastructure, or process change that fixed the incident.

## Lessons Learned

- **What went well:**
- **What went wrong:**
- **What was lucky:**

## Action Items

- [ ] **Fix:** Immediate technical resolution.
- [ ] **Prevention:** Test, validation, monitoring, alerting, or CI check to prevent recurrence.
- [ ] **Process:** Documentation or workflow change.

## Verification

- [ ] **Manual Check:**
- [ ] **Automated Tests:**
- [ ] **Deployment Check:**
```
