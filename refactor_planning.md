# Refactoring & Architectural Improvements Plan

As a Staff Software Engineer reviewing the `cover-craft` codebase, I have identified several areas for improvement focusing on maintainability, scalability, and operational excellence.

## 1. Build System: Deployment Optimization (esbuild)

- **Current State:** CI/CD zips the entire `node_modules` directory (~100MB), causing slow uploads and high Cold Start latency on Azure.
- **Why:** Serverless environments struggle with thousands of small files. Bundling reduces the "File Count" overhead.
- **Proposed Change:**
  - Implement **esbuild** to bundle the entire API into a single optimized `index.js`.
  - Mark native modules (like `canvas`) as external.
  - Goal: Reduce zip size by >70% and slash deployment/startup times.
- **Implementation Details:**
  - **Dependencies:** Add `esbuild` as a `devDependency` to `api/package.json`.
  - **External Modules:** The `canvas` package must be marked as external in the build script, as it relies on native binaries. Other large dependencies like `mongoose` will be bundled.
  - **Build Script:** Create a new `api/build.mjs` script. This will replace the existing `tsc` command and will be responsible for bundling the code. It must also include logic to copy static assets (e.g., the `fonts` directory), replacing the current `copy:assets` npm script.
  - **NPM Scripts:** The `"build"` script in `package.json` will be updated to `npm run build:shared && npm run copy:shared && node build.mjs`. This preserves the shared code handling while integrating the new esbuild process.
  - **CI/CD:** The `.github/workflows/azure_function.yml` must be modified. The deployment step will install production dependencies with `npm install --omit=dev` (to get the `canvas` binaries) and then create a zip archive of the `dist` directory and the production `node_modules` folder.
- **Results:**
  - **Bundled File Size:** `dist/index.js` is 2.7MB.
  - **Source Map Size:** `dist/index.js.map` is 5.2MB (used for debugging only, not deployed runtime).
  - **Deployment Package Size:** The `deploy.zip` file (containing `dist/` and production `node_modules/`) is 16MB.
  - **Impact:** This represents an **84% reduction** in deployment package size compared to the original estimated ~100MB. This significantly improves deployment speed and cold start times for the Azure Function.
  - **Remaining Size Analysis:** The majority of the remaining 16MB is due to the `node_modules` of external dependencies, primarily `mongoose` and its underlying `mongodb` driver, which were not bundled into `index.js`.

## 2. Build System: Shared Code Strategy

- **Current State:** The `api` project relies on a fragile shell script (`"copy:shared": "mkdir -p src/shared && cp ../shared/*.ts src/shared/"`) to include shared logic during the build process.
- **Why:** This "poor man's monorepo" approach is brittle, platform-dependent (requires unix-like shell), and error-prone. It duplicates code physically rather than referencing it.
- **Proposed Change:**
  - Migrate to **NPM Workspaces** (or Pnpm/Yarn workspaces).
  - Define `shared`, `api`, and `frontend` as workspaces in the root `package.json`.
  - Allow `api` and `frontend` to import `shared` as a proper local dependency.

---

## Completed Improvements

### Observability: Error Handling Standardization

- **Goal:** Standardize error handling and logging for improved debuggability and monitoring.
- **Changes Implemented:**
  - **Standardized Logger:** Implemented a functional `createLogger(context)` wrapper (`api/src/lib/logger.ts`) to ensure all logs are structured (JSON) and automatically include correlation IDs (`invocationId`, `functionName`).
  - **Log Sink:** Created a new MongoDB collection (`logs`) and integrated the logger to persist **ERROR** level logs to this collection.
  - **Logger Integration:** Integrated the `createLogger` into all Azure Function handlers (`analytics.ts`, `healthCheck.ts`, `metrics.ts`, `generateCoverImage.ts`), replacing existing `context.log` and `context.error` calls.

### Analytics: Data Source Consolidation & Metrics Refactor

- **Goal:** Resolve duplicate data ingestion and align metrics with platform usage (API vs UI).
- **Changes Implemented:**
  - **Frontend:** Refactored `sendGenerateEvent` to only send a minimal "intent" signal (event + clientDuration).
  - **Backend Analytics:** Shifted `fetchFeaturePopularity` and `fetchAccessibilityCompliance` to source exclusively from `IMAGE_GENERATED_EVENT` (backend truth) rather than the client click event.
  - **Metrics Refinement:**
    - Replaced "Success Rate" (redundant due to backend safeguards) with "UI Usage %" to track traffic attribution.
    - Removed "WCAG Failure Rate" as the backend now enforces compliance before generation.
    - Renamed internal metrics for clarity (`totalCoversGenerated` -> `uiGenerationAttempts`).