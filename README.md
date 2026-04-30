# Cover Craft

Cover Craft is a serverless cover image generator built with React, Azure Functions, Azure Queue Storage, MongoDB, and OpenTofu (Terraform-compatible).

It supports fast single-image generation and queued batch processing, with shared validation, accessibility checks, and automated Azure deployment built into the workflow.

[Live Project](https://cover-craft-ui.azurewebsites.net/) | [Full Documentation](./docs/README.md)

---

## Case Studies

| Case Study | Problem | How it was diagnosed | Result |
| :--- | :--- | :--- | :--- |
| [Azure Functions monorepo packaging](./docs/incidents/002-azure-functions-monorepo-package-deployment-failure.md) | The API artifact could deploy with a nested zip, missing production dependencies, or missing `@cover-craft/shared` output after the move to a workspace-based monorepo. | Compared the deployed package shape against Azure Functions runtime expectations and the monorepo assumptions captured in [ADR 004](./docs/decisions/004-full-stack-monorepo-orchestration.md). | CI now builds a self-contained API package from the correct root, installs production dependencies locally, and copies shared build output into the artifact. |
| [Batch API authentication boundary](./docs/incidents/004-batch-api-function-key-authentication-failure.md) | Batch generation and job-status polling failed after Azure Functions endpoints required function-key authentication. | Traced the BFF request path from Next.js route handlers to the secured Azure Functions API, then verified the proxy was missing `x-functions-key` for the architecture described in [ADR 006](./docs/decisions/006-batch-image-generation-architecture.md). | Proxy utilities now forward `AZURE_FUNCTION_KEY` server-side for batch submission and polling while keeping the secret out of the browser. |
| [Flex Consumption infrastructure migration](./docs/incidents/005-flex-consumption-deployment-configuration-failure.md) | Moving to Azure Functions Flex Consumption and Terraform-managed infrastructure exposed invalid app settings, missing CI authentication, and package execution assumptions. | Traced deployment failures to hosting-plan-specific requirements while implementing the infrastructure model in [ADR 007](./docs/decisions/007-infrastructure-as-code-azure-cloud-services.md). | CI now authenticates infrastructure deployment explicitly, the API runs from package, and incompatible Flex Consumption settings were removed. |

---

## Architecture

The platform has two generation paths:

| Path | Use case | Flow |
| :--- | :--- | :--- |
| Single image | Fast interactive generation | User request -> Azure Function -> Canvas renderer -> image response |
| Batch images | Larger workloads | User request -> HTTP 202 -> Azure Queue Storage -> retry-aware worker -> MongoDB job status |

```mermaid
graph TD
    User([User])
    UI[React UI]
    API[Azure Functions API]
    Single[Single Image Function]
    Batch[Batch Producer Function]
    Status[Job Status Function]
    Queue[Azure Queue Storage]
    Worker[Queue Worker Function]
    Render[Canvas Renderer]
    DB[(MongoDB Job State)]

    User --> UI
    UI --> API
    API --> Single
    Single --> Render
    Render --> UI
    API --> Batch
    API --> Status
    Batch --> Queue
    Batch --> DB
    Status --> DB
    Queue --> Worker
    Worker --> Render
    Worker --> DB
```

---

## Tech Stack

| Layer | Tools |
| :--- | :--- |
| Language | TypeScript, Node.js, React, Tailwind CSS |
| Infrastructure | Azure Functions, Azure Queue Storage, Azure hosting, Terraform |
| Data stores | MongoDB for job state and logs |
| Testing | Vitest |
| CI/CD | GitHub Actions |

---

## Documentation

- [Architecture](./docs/architecture/README.md)
- [Operations and CI/CD](./docs/operations.md)
- [Decisions](./docs/decisions/README.md)
- [Incidents](./docs/incidents/README.md)

---

## Local Setup

```bash
npm install
npm run build:shared
npm run dev:frontend
```

Run the API locally:

```bash
npm run start:api
```

Run checks:

```bash
npm run lint
npm run test
```
