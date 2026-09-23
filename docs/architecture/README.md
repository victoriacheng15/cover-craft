# Architecture

This directory documents the main system architecture for Cover Craft across the frontend and backend services.

| Area | Document | Scope |
| :--- | :--- | :--- |
| Frontend | [Frontend Architecture](./frontend.md) | Next.js App Router, BFF proxy layer, hooks, UI structure, and accessibility validation. |
| Backend | [Backend Architecture](./backend.md) | Azure Functions, image rendering, carousel jobs, MongoDB persistence, and analytics APIs. |

## System View

Cover Craft is split into a Next.js frontend and a Go Azure Functions backend. API contracts and types are synchronized from `openapi.yaml`, while Azure cloud resources are managed through OpenTofu.

```text
┌──────────────────────────────────────────────────────────────────┐
│                        Next.js Client UI                         │
└──────────────────────────────────────────────────────────────────┘
                                 │
                                 │ POST /api/generateImage (Single)
                                 │ POST /api/generateCarousel (Carousel)
                                 │ POST /api/generateGif (GIF Slideshow)
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
