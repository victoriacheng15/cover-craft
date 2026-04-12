# RCA 002: Azure Functions Monorepo Package Deployment Failure

- **Status:** Resolved
- **Date:** 2026-01-23
- **Severity:** Medium
- **Author:** Victoria Cheng
- **Related Commits:** `662eb51`, `0ac2078`

## Summary

Azure Functions deployment packaging failed because the monorepo build produced an artifact layout that did not match what Azure expected at runtime. The deployment workflow had to account for workspace dependencies, local production dependencies, and the shared package output.

## Impact

- **User Impact:** API releases could be blocked or deployed with missing runtime dependencies.
- **System Impact:** The Azure Functions deployment artifact could contain a nested zip or omit required local workspace files.
- **Duration:** Unknown. The packaging fixes were committed on 2026-01-23.

## Timeline

- **2026-01-23:** Nested zip issue identified in Azure Functions deployment.
- **2026-01-23:** Deployment workflow updated to package the API directory correctly.
- **2026-01-23:** Production dependency installation changed to force local API dependencies.
- **2026-01-23:** Shared package build output copied into the API package.

## Root Cause Analysis

The repository uses npm workspaces, but Azure Functions executes the deployed API artifact as a standalone app. The workflow initially depended on workspace behavior that is valid in the repository but not guaranteed inside the deployed artifact. This created two failure modes:

- The zip structure could be nested incorrectly for Azure Functions zip deployment.
- The shared workspace package and production dependencies might not exist physically inside the API package at runtime.

## Resolution

The workflow was updated to build a deployment artifact from the correct API package root. It also removed existing `node_modules`, installed production dependencies locally with `--no-package-lock`, and copied `shared/dist` into `node_modules/@cover-craft/shared/dist`.

## Lessons Learned

- **What went well:** The final workflow made the deployed artifact explicit and self-contained.
- **What went wrong:** Workspace resolution was treated as equivalent to deployment packaging.
- **What was lucky:** The fix stayed inside CI packaging and did not require API code changes.

## Action Items

- [x] **Fix:** Correct Azure Functions zip packaging and local dependency installation.
- [x] **Fix:** Ensure `@cover-craft/shared` compiled output is physically present in the artifact.
- [x] **Prevention:** Add an artifact inspection step that checks host files, `node_modules`, and shared `dist` output before deploy.
- [x] **Process:** Document deployment artifact expectations in operations docs.

## Verification

- [x] **Manual Check:** Inspect generated deployment zip for correct root structure.
- [x] **Automated Tests:** Add CI validation for required files in the Azure Functions package.
- [x] **Deployment Check:** Confirm Azure Functions starts successfully after zip deployment.
