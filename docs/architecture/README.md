# Architecture

This directory documents the main system architecture for Cover Craft across the frontend and backend services.

| Area | Document | Scope |
| :--- | :--- | :--- |
| Frontend | [Frontend Architecture](./frontend.md) | Next.js App Router, BFF proxy layer, hooks, UI structure, and accessibility validation. |
| Backend | [Backend Architecture](./backend.md) | Azure Functions, image rendering, batch jobs, MongoDB persistence, and analytics APIs. |

## System View

Cover Craft is split into a Next.js frontend and a Go Azure Functions backend. API contracts and types are synchronized from `openapi.yaml`, while Azure cloud resources are managed through OpenTofu.

```text
┌──────────────────────────────────────────────────────────────────┐
│                        Next.js Client UI                         │
└──────────────────────────────────────────────────────────────────┘
                                 │
                                 │ POST /api/generateImage (Single)
                                 │ POST /api/generateImages (Batch)
                                 │ POST /api/generateGif (GIF Slideshow)
                                 │ GET /api/jobStatus (Poll Status)
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                        Next.js BFF Server                        │
└──────────────────────────────────────────────────────────────────┘
         │                       │                       │
         │ /generateImage,       │ /generateImages       │ /getJobStatus
         │ /generateGif          ▼                       ▼
         ▼              ┌──────────────────┐    ┌──────────────────┐
┌──────────────────┐    │   Go Function    │    │   Go Function    │
│   Go Functions   │    │ (QueueProducer)  │    │  (GetJobStatus)  │
│(Image/GifRender) │    └──────────────────┘    └──────────────────┘
└──────────────────┘             │                       │
         │                       │ Enqueues              │ Reads
         │ Uses                  ▼                       │ Status
         ▼              ┌──────────────────┐             │
┌──────────────────┐    │   Azure Queue    │             │
│  Go 2D Graphics  │    │     Storage      │             │
│  & GIF Encoder   │    └──────────────────┘             │
└──────────────────┘             │                       │
         ▲                       │ Triggers              │
         │                       ▼                       │
         │              ┌──────────────────┐             │
         │              │   Go Function    │             │
         │              │  (QueueWorker)   │             │
         │              └──────────────────┘             │
         │                       │                       │
         └───────────────────────┤                       │
                                 │ Updates               │
                                 ▼                       ▼
                        ┌──────────────────────────────────┐
                        │             MongoDB              │
                        │    (Job Status & Telemetry)      │
                        └──────────────────────────────────┘
```
