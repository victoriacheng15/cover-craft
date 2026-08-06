# ADR 008: Migrate Azure Functions from Node.js to Go

- **Status:** Accepted
- **Date:** 2026-08-04
- **Author:** Victoria Cheng

## Context and Problem Statement

The application's serverless backend was originally written in TypeScript using the Azure Functions Node.js runtime. This architecture introduced several critical pipeline bottlenecks and build-time issues:

1. **Slow and Fragile CI/CD Workflows:** The Node.js Azure Function took an excessively long time to compile, install dependencies, and build during GitHub Actions workflow runs. This was primarily driven by the native compilation of C++ libraries like `canvas` (requiring `node-canvas` setup on the runner) and fetching large Node.js package trees.
2. **Complex and Error-Prone Packaging:** To prevent monorepo dependency hoisting from bloating the final deployment zip, the CI/CD workflow had to use fragile hacks (such as temporarily hiding/renaming root `package.json` files during `npm install` on the runner).
3. **Monorepo Workspace Contention:** Next.js 16/Turbopack struggled to resolve hoisted packages in subdirectories. This occasionally triggered automatic package reinstalls inside `frontend/node_modules/`, leading to duplicate React contexts and runtime invariant errors.

To improve developer velocity, ensure build repeatability, and optimize the deployment pipeline, the backend language and repository orchestration model needed to be re-evaluated.

## Decision Outcome

Re-platform the serverless backend to **Go (API v2)** and completely **flatten the monorepo workspaces**, separating the Next.js frontend into a standalone subdirectory project.

### Technical Implementation

- **Go Custom Handler Runtime:** Port the Azure Functions backend to Go, using a Go Custom Handler executing a compiled, static Linux binary on the Azure Functions Linux Consumption Plan.
- **Go Graphics Engine:** Replace the C++ `node-canvas` library with `github.com/fogleman/gg` (a pure Go 2D rendering library based on the Go standard image package). This removes all Cgo bindings and native C++ shared library compilation requirements.
- **Decoupled Standalone Workspaces:** Eliminate NPM Workspaces. Delete the root `package.json`, `package-lock.json`, and root `node_modules/`. Move all Node.js package configurations directly into the `frontend/` subdirectory, rendering it a standalone project.
- **Contract-Driven Type Parity:** Instead of importing TypeScript modules from a shared folder, use a contract-first design with `openapi.yaml`. Generate Go structs using `oapi-codegen` and TypeScript schemas using `openapi-typescript`, synchronized via `scripts/sync-contracts.sh` directly into the frontend.

## Consequences

### Positive

- **Deterministic, Native Compilation:** The Go backend compiles to a single static binary. Build runners no longer require complex C++ libraries or `node-gyp` setup, reducing CI build times and ensuring 100% build repeatability.
- **Fast, Simple Deployment Packaging:** Because Go compiles to a single, self-contained binary, the CI/CD pipeline does not need to perform complex `node_modules` pruning or workspace-hiding hacks. Packaging is reduced to simple zipping of the binary and assets.
- **Clean Frontend Isolation:** Removing workspaces stops hoisted dependency injection. The Next.js frontend resolves TypeScript packages locally, eliminating Turbopack compiler bugs and duplicate React context execution.
- **Stateless Simplicity:** Decoupling the frontend and backend into two clean, self-contained subdirectories (`frontend/` and `apiv2/`) simplifies local development, testing, and deployment.

### Negative

- **OpenAPI Schema Maintenance:** Hand-writing and maintaining the raw OpenAPI specification schema (`openapi.yaml`) is verbose and complex, introducing overhead whenever API request or response shapes need modification.
- **Go Syntax Translation:** Porting the business logic from TypeScript to Go required rewriting database queries, event routing, and drawing algorithms in Go's imperative structure.
- **Azure Plan Deprecation Risk:** The Azure Functions Linux Consumption plan is scheduled to reach End of Life (EOL) on September 30, 2028. This introduces a future migration requirement where the Go backend must be containerized and transitioned to Azure Container Apps or a containerized serverless hosting environment.

## Verification

- [x] **Automated Tests:** Run full unit test coverage and Gherkin BDD integration suites (`go test ./...` in `apiv2`).
- [x] **Contract Parity Audits:** Run `scripts/sync-contracts.sh` and verify that both Go models and TypeScript types compile without errors.
- [x] **Manual Verification:** Confirm that the live frontend dashboard proxies requests successfully to the Go API and renders identically without performance degradation.
