# Backend Architecture

The backend is a serverless API built on Azure Functions (Go 1.24 Custom Handler), responsible for high-fidelity single cover generation, multi-slide carousel compilation, animated GIF slideshows, and system metrics collection. It leverages a dual-path execution model to balance immediate UI feedback with scalable bulk operations, hosted on the **Flex Consumption (`FC1`)** plan for optimal performance and regional stability.

## Core Tech Stack

- **Runtime:** Azure Functions (Go 1.24 Custom Handler)
- **Hosting:** Azure Functions Flex Consumption (`FC1`) / Linux Plan
- **Infrastructure:** OpenTofu / Terraform (IaC)
- **Rendering:** Go 2D graphics (`github.com/fogleman/gg`), PDF document compilation (`github.com/phpdave11/gofpdf`), and animated GIF generation (`image/gif`)
- **Database:** MongoDB (via official Go driver `go.mongodb.org/mongo-driver/v2`)
- **Messaging:** Azure Queue Storage (for asynchronous job orchestration)
- **Testing:** Go standard `testing` package and `github.com/cucumber/godog` (BDD)
- **Contract Synchronization:** OpenAPI 3.1.0 (`openapi.yaml`) generating Go types via `make contract-sync`

## System Architecture

The platform implements two distinct execution patterns optimized for different workloads:

```text
                    ┌────────────────────────┐
                    │     Client Browser     │
                    └────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  Next.js BFF Gateway   │
                    └────────────────────────┘
         ┌───────────────────────┼───────────────────────┐
         │ /generateImage,       │ /generateCarousel     │ /jobStatus
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
                        │Background Worker │             │
                        │  (/processJobs)  │             │
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
                        │     (Job State & Telemetry)      │
                        └──────────────────────────────────┘
```

## Functions

### 1. Generate Single Image (Synchronous)

**Endpoint:** `POST /api/generateImage`

Direct, low-latency rendering path for immediate UI preview and single-image downloads.

- **Validation:** Enforces WCAG AA contrast (ratio ≥ 4.5:1), border width validation, and schema validation.
- **Output:** Returns an `image/png` buffer directly to the requester.
- **Telemetry:** Records execution duration and accessibility metrics in MongoDB.

### 2. Carousel Generation (Asynchronous)

**Endpoint:** `POST /api/generateCarousel`

Decoupled entry point for multi-slide carousel processing. Validates deck-level and slide-level parameters, creates a pending job document, and offloads processing to the storage queue.

- **Workflow:**
    1. Validates deck constraints (2 to 10 slides, Square `1080x1080` or Portrait `1080x1350`, WCAG AA contrast compliance across all slides).
    2. Creates a `Job` document in MongoDB with `type: 'carousel'` and `status: 'pending'`.
    3. Pushes the `jobId` to Azure Queue Storage.
    4. Returns HTTP 202 Accepted with the `jobId` immediately to the client.

### 3. Generate Animated GIF Slideshow (Synchronous)

**Endpoint:** `POST /api/generateGif`

Synchronous rendering path for multi-frame animated GIF slideshows (2 to 10 slides, delay 1000ms to 3000ms).

- **Validation:** Enforces slide count bounds (2 to 10), delay range (1000ms to 3000ms), supported font and layout per slide, and WCAG AA contrast compliance (ratio ≥ 4.5:1) across every slide.
- **Output:** Returns an `image/gif` buffer directly to the requester.
- **Telemetry:** Records execution duration and accessibility metrics in MongoDB.

### 4. Job Status Tracking

**Endpoint:** `GET /api/jobStatus` (or `GET /api/getJobStatus?jobId={id}`)

Allows the frontend to poll the current progress of an asynchronous generation operation.

- **Status States:** `pending` -> `processing` -> `completed` | `failed`.
- **Response:** Includes total slides, processed count, individual slide image URLs (Base64 data URIs), and the compiled `pdfUrl` document download.

### 5. Process Jobs (Background Worker)

**Trigger:** Queue Trigger via Azure Queue Storage (`myQueueItem`).

The core orchestration handler for asynchronous carousel workloads.

- **Logic:**
    1. Picks up `jobId` from the queue message payload.
    2. Updates MongoDB status to `processing`.
    3. Iteratively renders each slide in the carousel deck using the Go 2D graphics engine (`github.com/fogleman/gg`).
    4. Compiles the rendered slide images into a multi-page PDF document using `github.com/phpdave11/gofpdf`.
    5. Updates the job document with individual slide assets, compiled `pdfUrl`, and marks status `completed`.
    6. Emits `carousel_generated` telemetry metrics to the MongoDB collection.

### 6. Analytics & Metrics

**Endpoints:** `POST /api/metrics`, `GET /api/analytics`

- **Ingestion:** Captures P95/P99 latencies, WCAG compliance rates, slide counts, compile duration, and feature usage.
- **Aggregation:** Uses MongoDB aggregation pipelines in `internal/handlers/analytics.go` to provide on-the-fly system health and usage insights.

## Data Models

The backend utilizes structs in `internal/services/` and `internal/db/` synchronized from `openapi.yaml` to maintain strict contract integrity.

### Job Schema (Persistence)

```go
type Job struct {
    ID                  primitive.ObjectID   `bson:"_id,omitempty" json:"id"`
    Type                string               `bson:"type,omitempty" json:"type,omitempty"` // "carousel"
    Status              string               `bson:"status" json:"status"`                 // pending, processing, completed, failed
    Carousel            interface{}          `bson:"carousel,omitempty" json:"carousel,omitempty"`
    PDFURL              string               `bson:"pdfUrl,omitempty" json:"pdfUrl,omitempty"`
    Results             []string             `bson:"results" json:"results"`
    Error               string               `bson:"error,omitempty" json:"error,omitempty"`
    Attempts            int                  `bson:"attempts" json:"attempts"`
    MaxAttempts         int                  `bson:"maxAttempts" json:"maxAttempts"`
    ProcessingStartedAt *time.Time           `bson:"processingStartedAt,omitempty" json:"processingStartedAt,omitempty"`
    LastError           string               `bson:"lastError,omitempty" json:"lastError,omitempty"`
    ResultDetails       map[string]JobResult `bson:"resultDetails" json:"resultDetails"`
    CreatedAt           time.Time            `bson:"createdAt" json:"createdAt"`
    UpdatedAt           time.Time            `bson:"updatedAt" json:"updatedAt"`
}
```
