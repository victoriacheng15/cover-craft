# Backend Architecture

The backend is a serverless API built on Azure Functions (Go 1.24 Custom Handler), responsible for high-fidelity image and animated GIF generation, metrics collection, and asynchronous batch processing. It leverages a dual-path execution model to balance immediate UI feedback with scalable bulk operations, hosted on the **Flex Consumption (`FC1`)** plan for optimal performance and regional stability.

## Core Tech Stack

- **Runtime:** Azure Functions (Go 1.24 Custom Handler)
- **Hosting:** Azure Functions Flex Consumption (`FC1`) / Linux Plan
- **Infrastructure:** OpenTofu / Terraform (IaC)
- **Rendering:** Pure-Go 2D graphics (`github.com/fogleman/gg`) and Go standard library `image/gif` with palette quantization
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
         │ /generateImage,       │ /generateImages       │ /jobStatus
         │ /generateGif          ▼                       ▼
         ▼              ┌──────────────────┐    ┌──────────────────┐
┌──────────────────┐    │  Bulk Generator  │    │    Job Status    │
│ Sync Image / GIF │    │ (Asynchronous)   │    │ (Polling Check)  │
│ (Immediate Sync) │    └──────────────────┘    └──────────────────┘
└──────────────────┘             │                       │
         │                       │ Enqueues              │ Reads
         │ Uses                  ▼                       │ Status
         ▼              ┌──────────────────┐             │
┌──────────────────┐    │   Azure Queue    │             │
│ Pure-Go 2D & GIF │    │     Storage      │             │
│ Rendering Engine │    └──────────────────┘             │
└──────────────────┘             │                       │
         ▲                       │ Triggers              │
         │                       ▼                       │
         │              ┌──────────────────┐             │
         │              │ Background Job   │             │
         │              │ Worker (Process) │             │
         │              └──────────────────┘             │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │ Updates / Reads
                                 ▼
                        ┌──────────────────┐
                        │     MongoDB      │
                        │   (Job State)    │
                        └──────────────────┘
```

## Functions

### 1. Generate Single Image (Synchronous)

**Endpoint:** `POST /api/generateImage`

Direct, low-latency rendering path for immediate UI preview and single-image downloads.

- **Validation:** Enforces WCAG AA contrast (ratio ≥ 4.5:1), border width validation, and schema validation.
- **Output:** Returns an `image/png` buffer directly to the requester.
- **Telemetry:** Records execution duration and accessibility metrics in MongoDB.

### 2. Bulk Image Generation (Asynchronous)

**Endpoint:** `POST /api/generateImages`

Decoupled entry point for batch processing. Validates the request and persists a "pending" job state before offloading to the queue.

- **Workflow:**
    1. Validates the batch request (array of image configurations, maximum 5 items).
    2. Creates a `Job` document in MongoDB with `status: 'pending'`.
    3. Pushes the `jobId` to Azure Queue Storage.
    4. Returns the `jobId` immediately to the client.

### 3. Generate Animated GIF Slideshow (Synchronous)

**Endpoint:** `POST /api/generateGif`

Synchronous rendering path for multi-frame animated GIF slideshows (2 to 10 slides, delay 1000ms to 3000ms).

- **Validation:** Enforces slide count bounds (2 to 10), delay range (1000ms to 3000ms), supported font and layout per slide, and WCAG AA contrast compliance (ratio ≥ 4.5:1) across every slide.
- **Output:** Returns an `image/gif` buffer directly to the requester.
- **Telemetry:** Records execution duration and accessibility metrics in MongoDB.

### 4. Job Status Tracking

**Endpoint:** `GET /api/jobStatus/{id}`

Allows the frontend to poll the current progress of a batch operation.

- **Status States:** `pending` -> `processing` -> `completed` | `failed`.
- **Response:** Includes the total count, processed count, and an array of generated image URLs (Base64 data URIs).

### 5. Process Jobs (Background Worker)

**Trigger:** Queue Trigger via Azure Queue Storage (`myQueueItem`).

The core orchestration handler for batch workloads.

- **Logic:**
    1. Picks up `jobId` from the queue message payload.
    2. Updates MongoDB status to `processing`.
    3. Iteratively calls the pure-Go 2D rendering engine for each item in the batch.
    4. Updates the job document with progress and generated assets.
    5. Marks the job as `completed` upon success.

### 6. Analytics & Metrics

**Endpoints:** `POST /api/metrics`, `GET /api/analytics`

- **Ingestion:** Captures P95/P99 latencies, WCAG compliance rates, and feature usage.
- **Aggregation:** Uses MongoDB aggregation pipelines in `internal/services/analytics.go` to provide on-the-fly system health insights.

## Data Models

The backend utilizes structs in `internal/types/` synchronized from `openapi.yaml` to maintain strict contract integrity.

### Job Schema (Persistence)

```go
type Job struct {
    ID              primitive.ObjectID `bson:"_id,omitempty" json:"id"`
    JobID           string             `bson:"job_id" json:"jobId"`
    Status          string             `bson:"status" json:"status"` // pending, processing, completed, failed
    TotalImages     int                `bson:"total_images" json:"totalImages"`
    ProcessedImages int                `bson:"processed_images" json:"processedImages"`
    Results         []JobResult        `bson:"results" json:"results"`
    Error           string             `bson:"error,omitempty" json:"error,omitempty"`
    CreatedAt       time.Time          `bson:"created_at" json:"createdAt"`
    UpdatedAt       time.Time          `bson:"updated_at" json:"updatedAt"`
}
```
