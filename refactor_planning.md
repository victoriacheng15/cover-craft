# Refactoring & Architectural Improvements Plan

As a Staff Software Engineer reviewing the `cover-craft` codebase, I have identified several areas for improvement focusing on maintainability, scalability, and operational excellence.

## 1. Build System: Deployment Optimization (esbuild)

- **Current State:** CI/CD zips the entire `node_modules` directory (~100MB), causing slow uploads and high Cold Start latency on Azure.
- **Why:** Serverless environments struggle with thousands of small files. Bundling reduces the "File Count" overhead.
- **Proposed Change:**
  - Implement **esbuild** to bundle the entire API into a single optimized `index.js`.
  - Mark native modules (like `canvas`) as external.
  - Goal: Reduce zip size by >70% and slash deployment/startup times.

## 2. Build System: Shared Code Strategy

- **Current State:** The `api` project relies on a fragile shell script (`"copy:shared": "mkdir -p src/shared && cp ../shared/*.ts src/shared/"`) to include shared logic during the build process.
- **Why:** This "poor man's monorepo" approach is brittle, platform-dependent (requires unix-like shell), and error-prone. It duplicates code physically rather than referencing it.
- **Proposed Change:**
  - Migrate to **NPM Workspaces** (or Pnpm/Yarn workspaces).
  - Define `shared`, `api`, and `frontend` as workspaces in the root `package.json`.
  - Allow `api` and `frontend` to import `shared` as a proper local dependency.

## 3. Architectural Review: Next.js API Proxying

- **Current State:** The frontend uses Next.js Route Handlers (`src/app/api/*`) to proxy requests to the Azure Functions backend.
- **Why:** To avoid exposing the backend Azure Function URL directly to the client and to maintain a unified API surface area.
- **Proposed Change:**
  - **Optimization:** Since this is an intentional "BFF" (Backend for Frontend) pattern, ensure the proxy logic is as thin as possible to minimize overhead.
  - **Security Roadmap:** Currently uses `anonymous` auth. Future state requires disabling anonymous access on Azure and storing the `AZURE_FUNCTION_KEY` securely in Next.js server-side environment variables.
  - **Security:** Consider adding request validation or rate limiting at this layer in the future to further justify the proxy hop.

## 4. Observability: Error Handling Standardization

- **Current State:** Error handling is present but scattered (`console.error`, `context.error`).
- **Why:** Inconsistent logging makes debugging production issues harder.
- **Proposed Change:** 
  - Ensure all errors flow through a standardized logging wrapper that ensures logs are structured (JSON) and include correlation IDs where possible.
  - **Log Sink:** Persist critical application logs to a MongoDB collection (e.g., `system_logs`).
  - **Visualization:** Enable future integration with Grafana (via MongoDB datasource) for a centralized Observability Hub.

## 5. Analytics: Data Source Consolidation (Accessibility & Features)

- **Current State:** Frontend sends a rich `GENERATE_CLICK_EVENT` payload (contrast, wcag, size, etc.) which drives the analytics.
- **Problem:**
  - Duplicate Data: Backend *also* stores this data in `IMAGE_GENERATED_EVENT`.
  - Incomplete Data: Direct API calls (bypassing frontend) are missing from analytics.
  - Fragility: Client-side logic for "compliance" is less trustworthy than server-side.
- **Proposed Change:**
  - **Frontend:** Refactor `sendGenerateEvent` to only send a minimal "intent" signal (event + clientDuration).
  - **Backend Analytics:** Shift `fetchFeaturePopularity` and `fetchAccessibilityCompliance` to source from `IMAGE_GENERATED_EVENT` (Status: Success).
  - **Data Consistency:** Update filters so that "User Engagement" (clicks) doesn't require the detailed data fields anymore.
