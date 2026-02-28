# ADR 006: Batch Image Generation Architecture

- **Status:** Accepted
- **Date:** 2026-02-26
- **Author:** Victoria Cheng

## Context and Problem Statement

The application originally processed image generation requests synchronously. While effective for single images, power users generating 2-5 covers simultaneously would experience blocked UI threads, potential HTTP timeouts, and an unacceptable user experience during bulk operations. A scalable mechanism is required to process multiple generation requests concurrently while maintaining UI responsiveness. 

## Decision Outcome

Implementation of an **Asynchronous Job Queue Architecture** for batch image generation.

- **State Management:** MongoDB will be utilized to track the state of batch generation jobs (`pending`, `processing`, `completed`, `failed`), abstracting away the need for deploying a dedicated message broker (like Redis or RabbitMQ) at the current scale.
- **Client Polling:** The React frontend will immediately receive an accepted HTTP 202 response containing a `jobId`. It will then poll a status endpoint (`GET /api/jobStatus/{jobId}`) at an interval to retrieve progress updates and final Base64 image payloads.
- **Processor Reliability:** An event-driven Azure Queue-triggered Function (`processJobs.ts`) acts as the background processor. This replaces the originally proposed Timer Trigger approach, which introduced a sub-optimal 15-second polling latency. Utilizing Azure Queue Storage allows for instantaneous, distributed generation as soon as a job is provisioned.
- **Concurrency & Resilience:** The processor aggressively locks jobs via `.findOneAndUpdate` to prevent duplicate processing. It utilizes `Promise.allSettled` to guarantee that a failure on a single image computation does not crash the entire batch.

## Consequences

### Positive

- **[Unblocked User Experience]**: Offloading processing to a background queue ensures the frontend remains responsive and avoids gateway timeouts during heavy multi-image computations.
- **[Instantaneous Processing]**: Moving from Timer Triggers to Queue Triggers eliminates the processing delay, providing near-real-time results for batch operations.
- **[Fault Isolation]**: Utilizing `Promise.allSettled` guarantees that if one image configuration inside a batch throws an error, the rest of the batch successfully completes.
- **[Simplicity at Scale]**: Leveraging the existing MongoDB instance for job state instead of introducing a dedicated queuing service keeps the infrastructure footprint minimal and cost-effective.

### Negative

- **[Increased Polling Overhead]**: Short polling from the client increases the absolute number of network requests made to the API, albeit they are lightweight status checks.
- **[Database Contention Risk]**: Managing queues via MongoDB can lead to read/write contention if the system scales massively, though this is an acceptable trade-offs for current volume.

## Verification

- [x] **Automated Tests:** Verify backend job processor correctly updates status flags on success and failure scenarios via integration testing.
- [x] **Manual Verification:** Ensure the frontend can submit a batch of 5 configurations and gracefully poll until all images are displayed without layout shift.
