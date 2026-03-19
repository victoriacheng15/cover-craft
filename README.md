# 🎨 Cover Craft

A resilient, design-first image generation platform meticulously engineered to showcase modern serverless architecture, full-stack observability, and automated accessibility standards. It delivers a high-performance engine for creating WCAG-compliant cover images, leveraging a unified TypeScript monorepo and cloud-native telemetry.

Built using Next.js and orchestrated on Azure Functions, the platform unifies server-side canvas rendering, real-time analytics, and batch processing into a single, cohesive system. It's designed for operational excellence, demonstrating how to build an accessible, and maintainable application from the ground up while enforcing strict data privacy and stateless reliability.

🌐 [Project Portal](https://cover-craft-seven.vercel.app)

📚 [Documentation Hub: Architecture, ADRs & Operations](./docs/README.md)



### Key Milestones

[View Complete Evolution Log](https://cover-craft-seven.vercel.app/evolution)

- **Ch 1: Inception & Architecture** – Migrated to cloud-native serverless architecture with a Design-First methodology.
- **Ch 2: Foundation & Delivery** – Established Next.js frontend, CI/CD pipelines, and privacy-first analytics.
- **Ch 3: Launch & Operations** – Hardened production observability and unified full-stack monorepo orchestration.
- **Ch 4: Design Automation & Color** – Engineered algorithmic color randomization for guaranteed WCAG accessibility.
- **Ch 5: UX Refinement** – Optimized perceived performance with standardized skeleton loader patterns.
- **Ch 6: Scale & Asynchronous Architecture** – Architected event-driven batch processing via Azure Queue Storage.

---

## 🛠️ Tech Stack

The platform leverages a set of modern technologies for its core functions:

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6.svg?style=for-the-badge&logo=TypeScript&logoColor=white) ![Next.js](https://img.shields.io/badge/Next.js-000000.svg?style=for-the-badge&logo=nextdotjs&logoColor=white) ![React](https://img.shields.io/badge/React-61DAFB.svg?style=for-the-badge&logo=React&logoColor=black) ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4.svg?style=for-the-badge&logo=Tailwind-CSS&logoColor=white) ![Azure Functions](https://img.shields.io/badge/Azure_Functions-0078D4?style=for-the-badge&logo=azure-functions&logoColor=white) ![Node.js](https://img.shields.io/badge/Node.js-5FA04E.svg?style=for-the-badge&logo=nodedotjs&logoColor=white) ![MongoDB](https://img.shields.io/badge/MongoDB-47A248.svg?style=for-the-badge&logo=MongoDB&logoColor=white) ![Vitest](https://img.shields.io/badge/Vitest-00FF74.svg?style=for-the-badge&logo=Vitest&logoColor=white) ![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-2088FF.svg?style=for-the-badge&logo=GitHub-Actions&logoColor=white)

---

## 🏗️ System Architecture

The platform implements two distinct execution patterns for image generation, optimized for performance and user experience:

1. **Single Generation (Synchronous):** Direct, low-latency rendering path for immediate UI feedback.
2. **Bulk Generation (Asynchronous):** Decoupled, event-driven workflow using Azure Queue Storage for high-concurrency batch processing.

### Architecture Overview

```mermaid
graph TD
    User([User])
    subgraph "Frontend (Next.js)"
        UI[React UI]
    end

    subgraph "Backend (Azure Functions)"
        Gateway[API Gateway]
        Single[Generate Single Image]
        Bulk[Generate Images]
        Render[Canvas Rendering Engine]
        Queue[Azure Queue Storage]
        Worker[Process Jobs]
    end

    DB[(MongoDB)]

    User <--> UI
    UI <--> Gateway

    %% Path A: Single Generation
    Gateway -- "Sync" --> Single
    Single --> Render
    Single --> DB

    %% Path B: Bulk Generation
    Gateway -- "Async" --> Bulk
    Bulk --> Queue
    Queue --> Worker
    Worker --> Render
    Worker --> DB
```

---

## 🚀 Key Achievements & Capabilities

### ☸️ Platform Engineering & Infrastructure

- **Elastic Cloud Ingress:** Deployed an elastic backend on Azure Functions, ensuring zero-cost idling and rapid scaling for bursty generation workloads.
- **Monorepo Orchestration:** Unified frontend, backend, and shared logic into a single TypeScript monorepo, standardizing the build toolchain and testing (Vitest) across the stack.
- **Zero-Persistence Privacy:** Implemented a zero-persistence architecture for user data, utilizing stateless rendering pipelines to ensure complete anonymity and GDPR alignment.

### 🏗️ Software Architecture & Design

- **Shift-Left Accessibility Engine:** Engineered a WCAG AA contrast validation engine directly into the generation pipeline, preventing the creation of inaccessible content at the source.
- **Event-Driven Batch Workflow:** Built a resilient batch generation workflow using Azure Queue Storage and background workers (Process Jobs) to handle high-concurrency requests asynchronously.
- **Contract-Driven Development:** Leveraged shared validation schemas (Zod) to enforce strict type safety and request validation across the entire stack, ensuring 100% API contract integrity.

### 🔭 Observability & Performance

- **High-Fidelity Telemetry:** Standardized telemetry ingestion into MongoDB, providing on-the-fly aggregation for P95/P99 rendering performance and usage trends.
- **Synthetic Monitoring & Health:** Implemented comprehensive health check endpoints and synthetic monitoring to ensure high availability and proactive failure detection of the serverless stack.
- **Agentic Operational Readiness:** Designed the system to be AI-agent ready, with structured logging and clear domain isolation to facilitate automated maintenance and troubleshooting.

---

## 📋 Operational Governance

- **Decision Framework:** Adopted Architectural Decision Records (ADRs) to document system evolution and manage technical debt.
- **CI/CD Excellence:** Automated quality gates for linting, type-checking, and unit testing via GitHub Actions, ensuring every commit meets production standards.
