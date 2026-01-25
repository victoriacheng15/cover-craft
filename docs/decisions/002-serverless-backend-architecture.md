# ADR 002: Serverless Backend Architecture

- **Status:** Accepted
- **Date:** 2025-09-23
- **Author:** Victoria Cheng

## Context and Problem Statement

The application required a backend capable of handling image generation without the overhead of maintaining dedicated server infrastructure. A solution was needed that could scale automatically and minimize operational costs for a tool with variable traffic patterns.

## Decision Outcome

A **Serverless Backend** architecture was selected using Azure Functions (TypeScript).
- **Zero Maintenance:** Azure Functions were chosen to eliminate server management and maintenance overhead.
- **Event-Driven Execution:** The architecture ensures that functions execute only when triggered by an HTTP request, preventing resource waste during idle periods.
- **Stateless Design:** Core logic was focused on stateless image generation to ensure high availability and simplicity.

## Consequences

- **Positive:**
  - Reduced operational costs to near-zero via consumption-based pricing.
  - Automatic horizontal scaling to handle spikes in traffic without manual intervention.
  - Significant reduction in operational complexity (no OS updates or server patching).
- **Negative/Trade-offs:**
  - Introduced "Cold Start" latency for the first request after periods of inactivity.
  - Increased complexity in local debugging, requiring specialized emulation tools (Azure Core Tools).

## Verification

- [x] **Manual Check:** Core image generation logic verified in production environments.
- [x] **Automated Tests:** Validated via function unit tests:
  - `api/src/functions/__tests__/generateCoverImage.test.ts`
  - `api/src/functions/__tests__/healthCheck.test.ts`
