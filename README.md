# Cover Craft

Cover Craft is a production-grade, serverless media generation engine built with Go, Next.js, and Azure, 100% codified via Terraform and containerized locally using rootless Podman Dev Containers.

[Live Project](https://cover-craft-ui.azurewebsites.net/) | [Full Documentation](./docs/README.md)

---

## Platform & Infrastructure Highlights

* **100% Infrastructure as Code (Terraform):** All compute, storage, and networking layers (Azure Functions, App Service, Queue Storage, Application Insights, and Blob Storage for `tfstate` locking) are declared declaratively with zero manual Azure Portal changes.
* **Deterministic CI/CD Automation:** Multi-stage GitHub Actions workflows enforce automated Terraform validation, plan generation, and deployment alongside discrete artifact packaging for Go binaries and Next.js standalone bundles.
* **Containerized Local Dev Loop (Podman / Dev Containers):** Complete local parity running Next.js, the Go custom runtime host, and Azurite (Azure Storage emulator) orchestrating multi-service hot-reloading in isolated rootless Podman/Docker containers.
* **Operational Maturity:** Documented Architecture Decision Records (ADRs) and blameless incident postmortems tracking monorepo packaging, authentication boundaries, and runtime plan migrations.

---

## Operational Incidents & Postmortems

| Postmortem / Decision | Problem | How it was diagnosed | Result |
| :--- | :--- | :--- | :--- |
| [Azure Functions monorepo packaging](./docs/incidents/002-azure-functions-monorepo-package-deployment-failure.md) | The API artifact could deploy with a nested zip, missing production dependencies, or missing `@cover-craft/shared` output after the move to a workspace-based monorepo. | Compared the deployed package shape against Azure Functions runtime expectations and the monorepo assumptions captured in [ADR 004](./docs/decisions/004-full-stack-monorepo-orchestration.md). | CI now builds a self-contained API package from the correct root, installs production dependencies locally, and copies shared build output into the artifact. |
| [Batch API authentication boundary](./docs/incidents/004-batch-api-function-key-authentication-failure.md) | Batch generation and job-status polling failed after Azure Functions endpoints required function-key authentication. | Traced the BFF request path from Next.js route handlers to the secured Azure Functions API, then verified the proxy was missing `x-functions-key` for the architecture described in [ADR 006](./docs/decisions/006-batch-image-generation-architecture.md). | Proxy utilities now forward `AZURE_FUNCTION_KEY` server-side for batch submission and polling while keeping the secret out of the browser. |
| [Flex Consumption infrastructure migration](./docs/incidents/005-flex-consumption-deployment-configuration-failure.md) | Moving to Azure Functions Flex Consumption and Terraform-managed infrastructure exposed invalid app settings, missing CI authentication, and package execution assumptions. | Traced deployment failures to hosting-plan-specific requirements while implementing the infrastructure model in [ADR 007](./docs/decisions/007-infrastructure-as-code-azure-cloud-services.md). | CI now authenticates infrastructure deployment explicitly, the API runs from package, and incompatible Flex Consumption settings were removed. |

---

## Architecture & Infrastructure

Deployment is fully automated through GitHub Actions upon push to `main`. The pipeline initializes remote state in Azure Blob Storage, applies infrastructure changes, and deploys production artifacts:

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
│        go-deploy.zip         │    │     frontend-deploy.zip      │
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
                                 │ GET /api/getJobStatus (Poll Status)
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
| Language & Core | Go, TypeScript, React, Next.js, Tailwind CSS |
| Media Processing | 2D graphics (`fogleman/gg`), PDF compiler (`jung-kurt/gofpdf`), animated GIF encoder (`image/gif`) |
| Infrastructure (100% IaC) | Terraform on Azure (Functions Flex Consumption, App Service, Queue Storage, Application Insights, Blob Storage) |
| Local Platform & Virtualization | Podman / Docker Dev Containers, Azurite emulator, GNU Make |
| Data & State | Queue Storage (async buffering), MongoDB (job state & analytics), Blob Storage (`tfstate`) |
| Quality & CI/CD | GitHub Actions, Vitest, Go test / BDD, contract validation via OpenAPI 3.0 |

---

## API Endpoints

The API follows a contract-first design with `openapi.yaml` as the canonical specification:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/generateImage` | Synchronous cover image generation (PNG) |
| `POST` | `/generateCarousel` | Asynchronous carousel generation (multi-page PDF and PNGs) |
| `POST` | `/generateGif` | Synchronous animated slideshow cover generation (GIF) |
| `GET` | `/getJobStatus` | Poll status and download URLs for carousel generation jobs |
| `GET` | `/analytics` | System telemetry, format distribution, and user engagement metrics |
| `POST` | `/metrics` | Buffered ingestion of client telemetry events |
| `GET` | `/health` | Service health check |

---

## Documentation

* [Architecture](./docs/architecture/README.md)
* [Operations and CI/CD](./docs/operations.md)
* [Decisions](./docs/decisions/README.md)
* [Incidents](./docs/incidents/README.md)

---

## Local Development Environment

### 1. Containerized Local Development (Podman / Docker)

The repository provides a complete containerized developer environment using Podman or Docker. This launches the Next.js BFF, Go runtime, and Azurite emulator with live volume mounting and hot-reloading:

```bash
# Build the local containerized environment
make dev-build

# Launch the container stack with hot-reloading enabled
make dev-run

# Stream multi-service logs
make dev-logs

# Tear down the container environment
make dev-stop
```

### 2. Standalone Host Setup (Alternative)

To run components directly on the host machine rather than inside a container:

#### Frontend

Install dependencies and start the Next.js development server from the repository root:

```bash
make install-ui
make run-ui
```

#### Go API & Storage Emulator

In a separate terminal window at the repository root, start Azurite storage emulator and launch the Go Functions host:

```bash
make run-go
```

### 3. Checks & Tests

Execute quality checks and tests across the stack from the repository root:

```bash
# Run all Go unit and BDD end-to-end tests
make test-all-go

# Run Go coverage analysis
make cov-go

# Run frontend tests
make test-ui

# Audit and format frontend code
make lint-ui
make format-ui
```
