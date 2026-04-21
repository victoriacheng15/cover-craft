# Cover Craft

Cover Craft is a serverless image generation platform built with Next.js, Azure Functions, Azure Queue Storage, and MongoDB.

It supports both real-time single image generation and background batch processing for larger workloads.

[Live Project](https://cover-craft-ui.azurewebsites.net/) | [Full Documentation](./docs/README.md)

---

## Highlights

| Area | What it demonstrates |
| :--- | :--- |
| Background processing | Batch requests return quickly with HTTP 202, then run through Azure Queue Storage and a queue-triggered worker |
| Reliable worker design | MongoDB state tracking and atomic claim-and-lock prevent duplicate processing during queue retries |
| Progress tracking | Real-time job status enables frontend polling and incremental result updates |
| Accessibility | WCAG contrast validation is built into the image generation flow |
| Shared validation | Frontend and backend use shared validators to ensure consistent data integrity |
| Cloud delivery | GitHub Actions and Terraform (OpenTofu) support repeatable deployment |
| Observability | Structured logs, metrics, and Application Insights support debugging and monitoring |

---

## Architecture

The platform has two generation paths:

| Path | Use case | Flow |
| :--- | :--- | :--- |
| Single image | Fast interactive generation | Request -> Azure Function -> Canvas renderer -> response |
| Batch images | Larger workloads | Request -> HTTP 202 -> Azure Queue Storage -> worker -> MongoDB job status |

```mermaid
graph TD
    User([User])
    UI[Next.js UI]
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
| Frontend | Next.js, React, Tailwind CSS |
| Backend | Azure Functions, Node.js, TypeScript |
| Processing | Azure Queue Storage, Canvas rendering |
| Data | MongoDB |
| Infrastructure | OpenTofu, Azure |
| CI/CD | GitHub Actions |
| Testing | Vitest |

---

## Documentation

- [Architecture](./docs/architecture/README.md)
- [Operations and CI/CD](./docs/operations.md)
- [Architectural Decision Records](./docs/decisions/README.md)
- [Incident Reports](./docs/incidents/README.md)

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
