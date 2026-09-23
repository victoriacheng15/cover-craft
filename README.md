# Cover Craft

Cover Craft is a serverless cover image, multi-slide carousel, and animated GIF generator built with React, Next.js, Go, Azure Functions, Azure Queue Storage, MongoDB, and Terraform.

It supports single-cover generation, multi-slide carousel generation (PDF and PNG exports), and multi-frame animated GIF slideshows, with shared validation, accessibility checks, and automated Azure deployment built into the workflow.

[Live Project](https://cover-craft-ui.azurewebsites.net/) | [Full Documentation](./docs/README.md)

---

## Case Studies

| Case Study | Problem | How it was diagnosed | Result |
| :--- | :--- | :--- | :--- |
| [Azure Functions monorepo packaging](./docs/incidents/002-azure-functions-monorepo-package-deployment-failure.md) | The API artifact could deploy with a nested zip, missing production dependencies, or missing `@cover-craft/shared` output after the move to a workspace-based monorepo. | Compared the deployed package shape against Azure Functions runtime expectations and the monorepo assumptions captured in [ADR 004](./docs/decisions/004-full-stack-monorepo-orchestration.md). | CI now builds a self-contained API package from the correct root, installs production dependencies locally, and copies shared build output into the artifact. |
| [Batch API authentication boundary](./docs/incidents/004-batch-api-function-key-authentication-failure.md) | Batch generation and job-status polling failed after Azure Functions endpoints required function-key authentication. | Traced the BFF request path from Next.js route handlers to the secured Azure Functions API, then verified the proxy was missing `x-functions-key` for the architecture described in [ADR 006](./docs/decisions/006-batch-image-generation-architecture.md). | Proxy utilities now forward `AZURE_FUNCTION_KEY` server-side for batch submission and polling while keeping the secret out of the browser. |
| [Flex Consumption infrastructure migration](./docs/incidents/005-flex-consumption-deployment-configuration-failure.md) | Moving to Azure Functions Flex Consumption and Terraform-managed infrastructure exposed invalid app settings, missing CI authentication, and package execution assumptions. | Traced deployment failures to hosting-plan-specific requirements while implementing the infrastructure model in [ADR 007](./docs/decisions/007-infrastructure-as-code-azure-cloud-services.md). | CI now authenticates infrastructure deployment explicitly, the API runs from package, and incompatible Flex Consumption settings were removed. |

---

## Architecture & Infrastructure

### Infrastructure & Deployment Pipeline

The platform's cloud infrastructure is declared using Terraform and deployed via GitHub Actions, with remote state tracked in Azure Blob Storage:

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
                                 │ 2. Sets up Terraform (v1.6.0)
                                 │ 3. Runs 'terraform init & apply'
                                 │ 4. Deploys apps via Actions
      ┌────────────────────┐     │
      │ Azure Blob Storage │ <-> │
      │     (tfstate)      │     │
      └────────────────────┘     ▼
┌──────────────────────────────────────────────────────────────────┐
│                 Terraform Infrastructure Apply                   │
│    (Provision storage, App Insights, Function App, App Service)  │
└──────────────────────────────────────────────────────────────────┘
               │                                   │
               │ Build & Package                   │ Build & Package
               ▼                                   ▼
┌──────────────────────────────┐    ┌──────────────────────────────┐
│       apiv2-deploy.zip       │    │ Create frontend-deploy.zip   │
│         (Go Binary)          │    │ (Next.js Standalone build)   │
└──────────────────────────────┘    └──────────────────────────────┘
               │                                   │
               │ Zip Deploy                        │ Zip Deploy
               │ (functions-action)                │ (webapps-deploy)
               ▼                                   ▼
┌──────────────────────────────┐    ┌──────────────────────────────┐
│       Go Function App        │    │     Azure App Service UI     │
└──────────────────────────────┘    └──────────────────────────────┘
```

### Application Request Flow

The platform provides three runtime generation paths:

| Path | Use case | Flow |
| :--- | :--- | :--- |
| Image covers | Fast interactive cover generation | User request -> Go Function -> Go 2D graphics library -> PNG response |
| Carousel decks | Multi-slide carousels (PDF and PNG) | User request -> HTTP 202 -> Azure Queue Storage -> Go Function worker (renderer & PDF compiler) -> MongoDB job status |
| Animated GIF slideshow | Multi-slide animated social clips | User request -> Go Function -> Go 2D graphics & GIF encoder -> animated GIF response |

```text
┌──────────────────────────────────────────────────────────────────┐
│                        Next.js Client UI                         │
└──────────────────────────────────────────────────────────────────┘
                                 │
                                 │ POST /api/generateImage (Cover)
                                 │ POST /api/generateCarousel (Carousel)
                                 │ POST /api/generateGif (Slideshow)
                                 │ GET /api/jobStatus (Poll Status)
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                        Next.js BFF Server                        │
└──────────────────────────────────────────────────────────────────┘
         │                       │                       │
         │ /generateImage,       │ /generateCarousel     │ /getJobStatus
         │ /generateGif          │                       │
         ▼                       ▼                       ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│    Image/GIF     │    │Carousel Generator│    │    Job Status    │
│    Generator     │    │  (Asynchronous)  │    │ (Polling Check)  │
└──────────────────┘    └──────────────────┘    └──────────────────┘
         │                       │                       │
         │                       │ Enqueues              │ Reads
         │ Uses                  ▼                       │ Status
         ▼              ┌──────────────────┐             │
┌──────────────────┐    │   Azure Queue    │             │
│   2D Graphics    │    │     Storage      │             │
│   & GIF Engine   │    └──────────────────┘             │
└──────────────────┘             │                       │
                                 │ Triggers              │
                                 ▼                       │
                        ┌──────────────────┐             │
                        │   Go Function    │             │
                        │  (QueueWorker)   │             │
                        └──────────────────┘             │
                                 │                       │
                                 │ Uses                  │
                                 ▼                       │
                        ┌──────────────────┐             │
                        │    PNG & PDF     │             │
                        │     Compiler     │             │
                        └──────────────────┘             │
                                 │                       │
                                 │ Updates               │
                                 ▼                       ▼
                        ┌──────────────────────────────────┐
                        │             MongoDB              │
                        │    (Job Status & Telemetry)      │
                        └──────────────────────────────────┘
```

---

## Tech Stack

| Layer | Tools |
| :--- | :--- |
| Language | Go, TypeScript, React, Tailwind CSS |
| Graphics & Document Rendering | 2D graphics (gg), PDF compiler (gofpdf), and animated GIF encoder (image/gif) |
| Infrastructure | Azure Functions, Azure Queue Storage, Azure App Service, Terraform |
| Data stores | MongoDB for job state and metrics |
| Testing | Vitest, Go testing (Unit & BDD) |
| CI/CD | GitHub Actions |

---

## API Endpoints

The API follows a contract-first design with `openapi.yaml` as the canonical specification:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/generateImage` | Synchronous cover image generation (PNG) |
| `POST` | `/generateCarousel` | Asynchronous carousel generation (multi-page PDF and PNGs) |
| `POST` | `/generateGif` | Synchronous animated slideshow cover generation (GIF) |
| `GET` | `/jobStatus` | Poll status and download URLs for carousel generation jobs |
| `GET` | `/analytics` | System telemetry, format distribution, and user engagement metrics |
| `POST` | `/metrics` | Buffered ingestion of client telemetry events |
| `GET` | `/health` | Service health check |

---

## Documentation

- [Architecture](./docs/architecture/README.md)
- [Operations and CI/CD](./docs/operations.md)
- [Decisions](./docs/decisions/README.md)
- [Incidents](./docs/incidents/README.md)

---

## Local Setup

### 1. Run Frontend Locally

Install dependencies:

```bash
make install-ui
```

Then start the Next.js development server from the repository root:

```bash
make run-ui
```

### 2. Run API Locally

In a separate terminal window at the repository root, start Azurite storage emulator and launch the Go Functions host:

```bash
make run-go
```

### 3. Run inside Dev Container

Alternatively, the entire stack can run inside a local development container. This configuration utilizes Podman/Docker to orchestrate Next.js, the Go Azure Functions API, and Azurite with hot-reloading enabled.

```bash
# Build the development container
make dev-build

# Start the container with hot-reloading
make dev-run

# Tail the logs
make dev-logs

# Stop the container
make dev-stop
```

### 4. Run Checks & Tests

Execute checks from the root directory:

```bash
# Run Go unit and BDD tests
make test-all-go

# Run Go coverage analysis
make cov-go

# Run frontend tests
make test-ui
```
