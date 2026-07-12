# Operations & CI/CD

This document outlines the GitHub Actions workflows and automation practices for the Cover Craft project.

## Automation Pipelines

We use path-based triggering to ensure pipelines only run when relevant files are modified.

| Workflow | File | Trigger | Purpose |
| :--- | :--- | :--- | :--- |
| **Infrastructure & Code Deployment** | `infra-deploy.yml` | Push to `main` when `tofu/`, app workspaces, or root package files change; manual dispatch | Applies OpenTofu, then zip-deploys the Azure Functions API and Next.js frontend to Azure. |
| **CI - Lint & Test** | `ci.yml` | PR or push to `main` when code or documentation changes; manual dispatch | Runs Biome code checks, Markdown linting, and selectively executes backend and frontend test suites based on modified paths. |

## Deployment Configuration

### Platform Infrastructure (Azure)

Managed via OpenTofu (IaC) and orchestrated in Canada Central.

| Setting | Value | Description |
| :--- | :--- | :--- |
| **Infrastructure Engine** | `OpenTofu` | Codified resource management via `.tf` files. |
| **Tofu State Backend** | `Azure Blob Storage (tfstate)` | Remote state management to prevent configuration drift. |
| **API Plan** | `Flex Consumption (FC1)` | High-performance serverless Node.js 22 runtime. |
| **Frontend Plan** | `App Service (F1)` | Zero-cost Linux hosting for the Next.js standalone UI. |
| **Primary Region** | `Canada Central` | Targeted regional deployment for performance and compliance. |
| **API App** | `cover-craft` | Azure Functions app deployed from `api-deploy.zip`. |
| **Frontend App** | `cover-craft-ui` | Azure Web App deployed from `frontend-deploy.zip`. |
| **Build Node Version** | `24` | Node version used by GitHub Actions during CI and deployment builds. |

### Secrets Management

| Secret Name | Required By | Description |
| :--- | :--- | :--- |
| `AZURE_CREDENTIALS` | `infra-deploy.yml` | Service principal credentials for `azure/login` and Tofu `ARM_*` auth. |
| `MONGODB_URI` | `infra-deploy.yml` | Connection string for MongoDB (passed to Tofu as a variable). |

### Deployment Jobs

| Job | Depends On | Responsibility |
| :--- | :--- | :--- |
| `infra-apply` | None | Logs into Azure, initializes OpenTofu, and applies `tofu/` configuration. |
| `deploy-api` | `infra-apply` | Builds `shared` and `api`, installs API production dependencies locally, copies `shared/dist`, creates `api-deploy.zip`, and deploys to Azure Functions. |
| `deploy-frontend` | `infra-apply` | Builds `shared` and the Next.js standalone frontend, packages static assets, creates `frontend-deploy.zip`, deploys to Azure Web App, and sets the startup command. |

## Pipeline Architecture

### 1. Continuous Integration (PR Validation)

```text
┌──────────────────────────────────────────────────────────────────┐
│                    GitHub PR or Push to main                     │
└──────────────────────────────────────────────────────────────────┘
                 │                                  │
                 ▼ (Path Filter)                    ▼
┌──────────────────────────────┐    ┌──────────────────────────────┐
│   Verify api/ or shared/     │    │   Run Project-Wide Linting   │
│   code changes exist         │    │   (Biome & Markdownlint)     │
└──────────────────────────────┘    └──────────────────────────────┘
                 │                                  │
                 ├──────────────────────────────────┤
                 ▼                                  ▼
┌──────────────────────────────┐    ┌──────────────────────────────┐
│       Run API Tests          │    │     Run Frontend Tests       │
│       (Vitest suite)         │    │       (Vitest suite)         │
└──────────────────────────────┘    └──────────────────────────────┘
                 │                                  │
                 └────────────────┬─────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                   PR Verified / Ready to Merge                   │
└──────────────────────────────────────────────────────────────────┘
```

### 2. Continuous Deployment

The entire platform is orchestrated as a single, cohesive unit on Azure.

```text
┌──────────────────────────────────────────────────────────────────┐
│                     Git Push / Merge to main                     │
└──────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                  GitHub Actions Runner (CI/CD)                   │
└──────────────────────────────────────────────────────────────────┘
                                 │
                                 │ 1. Azure Login (Service Principal)
                                 │ 2. Sets up OpenTofu (v1.6.0)
      ┌────────────────────┐     │ 3. Runs 'tofu init & apply'
      │ Azure Blob Storage │ <-> │
      │     (tfstate)      │     │
      └────────────────────┘     ▼
┌──────────────────────────────────────────────────────────────────┐
│                 OpenTofu Infrastructure Apply                    │
│    (Provision storage, App Insights, Function App, App Service)  │
└──────────────────────────────────────────────────────────────────┘
               │                                   │
               │ Build & Package                   │ Build & Package
               ▼                                   ▼
┌──────────────────────────────┐    ┌──────────────────────────────┐
│   Create api-deploy.zip      │    │ Create frontend-deploy.zip   │
│   (Bundles shared package)   │    │ (Next.js Standalone build)   │
└──────────────────────────────┘    └──────────────────────────────┘
               │                                   │
               │ Zip Deploy                        │ Zip Deploy
               │ (config-zip)                      │ (config-zip)
               ▼                                   ▼
┌──────────────────────────────┐    ┌──────────────────────────────┐
│        Azure Function        │    │     Azure App Service UI     │
│       ("cover-craft")        │    │      ("cover-craft-ui")      │
└──────────────────────────────┘    └──────────────────────────────┘
```
