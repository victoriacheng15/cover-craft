# RCA 005: Flex Consumption Deployment Configuration Failure

- **Status:** Resolved
- **Date:** 2026-04-08
- **Severity:** Medium
- **Author:** Victoria Cheng
- **Related Commits:** `610bc91`, `e95688c`, `20919b4`

## Summary

The Azure migration to Flex Consumption and OpenTofu exposed several deployment configuration mismatches. CI needed service principal authentication for OpenTofu, the API deployment required package-based execution, and an unsupported build setting had to be removed for Flex Consumption compatibility.

## Impact

- **User Impact:** Releases to Azure could be blocked or deployed in a non-running state.
- **System Impact:** Infrastructure deployment and API runtime configuration were not aligned with Flex Consumption requirements.
- **Duration:** Unknown. The configuration fixes were committed on 2026-04-08.

## Timeline

- **2026-04-08:** OpenTofu service principal authentication issue resolved in CI.
- **2026-04-08:** API deployment configured with `WEBSITE_RUN_FROM_PACKAGE`.
- **2026-04-08:** Unsupported `SCM_DO_BUILD` setting removed for Flex Consumption.

## Root Cause Analysis

The infrastructure moved to a newer Azure Functions hosting model with different deployment assumptions from the previous setup. The CI and app settings still carried assumptions from earlier deployment flows:

- OpenTofu needed explicit Azure service principal authentication in the workflow.
- The API needed to run from the deployed package.
- `SCM_DO_BUILD` was not supported for the Flex Consumption deployment path.

These configuration mismatches surfaced as deployment failures rather than application-code failures.

## Resolution

The infrastructure deployment workflow was updated to provide OpenTofu with service principal authentication. The Function App settings were changed to enable `WEBSITE_RUN_FROM_PACKAGE`, and the unsupported `SCM_DO_BUILD` setting was removed.

## Lessons Learned

- **What went well:** The fixes isolated platform-specific configuration from application code.
- **What went wrong:** Migration to a new hosting plan reused settings that were not valid for the new runtime model.
- **What was lucky:** The failures were caught in deployment configuration before requiring a broader application rollback.

## Action Items

- [x] **Fix:** Configure OpenTofu Azure authentication in CI.
- [x] **Fix:** Enable package-based API deployment.
- [x] **Fix:** Remove unsupported Flex Consumption app setting.
- [x] **Prevention:** Add deployment configuration notes for Azure Functions Flex Consumption.
- [x] **Process:** Review hosting-plan-specific settings during future platform migrations.

## Verification

- [x] **Manual Check:** Review Function App settings after deployment.
- [x] **Automated Tests:** Add workflow validation for required Azure/OpenTofu environment variables.
- [x] **Deployment Check:** Confirm infrastructure deploy and API package deploy complete successfully.
