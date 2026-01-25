# ADR 004: Full-Stack Monorepo Orchestration

- **Status:** Accepted
- **Date:** 2026-01-23
- **Author:** Victoria Cheng

## Context and Problem Statement

As the system evolved, maintaining separate repositories for the frontend, backend, and shared logic became inefficient. This separation led to "dependency drift," where API contracts and frontend types would frequently fall out of sync. Furthermore, managing multiple release cycles and atomic updates across different repositories introduced significant operational friction.

## Decision Outcome

A **Full-Stack Monorepo** strategy was adopted.

- **Unified Workspace:** All components (frontend, api, and shared libraries) were consolidated into a single repository using npm workspaces.
- **Shared Type Safety:** Logic and validators were moved to a `shared/` package, providing a single source of truth for both the frontend and backend.
- **Atomic Commits:** Architectural changes that span across the stack can now be implemented, tested, and reviewed within a single pull request.

## Consequences

- **Positive:**
  - Eliminated type inconsistencies by sharing TypeScript interfaces across the entire stack.
  - Reduced engineering overhead by standardizing tooling, linting, and testing configurations.
  - Improved development velocity through atomic commits and simplified local development setup.
- **Negative/Trade-offs:**
  - Increased complexity in workspace-aware tooling configuration (e.g., managing multiple TypeScript project references and linting boundaries).
  - Increased complexity in artifact bundling, particularly ensuring native dependencies (e.g., `canvas`) are correctly included in workspace-aware deployments.

## Verification

- [x] **Manual Check:** Verified that changes in `shared/` are correctly picked up by both `frontend` and `api` packages locally.
- [x] **Automated Tests:** Validated via the shared validation logic and its consumption in:
  - `api/src/lib/__tests__/mongoose.test.ts`
  - `frontend/src/app/api/_utils/errorHandler.test.ts`
