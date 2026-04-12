# Architectural Decision Records (ADR)

This directory contains the architectural decisions made during the evolution of Cover Craft.

| ID | Title | Description | Status |
| :--- | :--- | :--- | :--- |
| [007](./007-infrastructure-as-code-azure-cloud-services.md) | **Infrastructure as Code for Azure Cloud Services** | Migration of Azure Web App, Azure Functions, storage, Application Insights, and cloud configuration management into OpenTofu modules and CI deployment orchestration. | Accepted |
| [006](./006-batch-image-generation-architecture.md) | **Asynchronous Job Queue Architecture** | Formalization of the architectural shift from synchronous HTTP processing to a stateless Background Worker model backed by MongoDB. | Accepted |
| [005](./005-randomize-colors-feature.md) | **Randomize Colors Feature** | Implementation of a client-side random color generator integrated with existing form state and contrast validation checks. | Accepted |
| [004](./004-full-stack-monorepo-orchestration.md) | **Full-Stack Monorepo Orchestration** | Consolidation of frontend, backend, and shared libraries into a unified workspace for improved velocity and consistency. | Accepted |
| [003](./003-in-app-analytics-strategy.md) | **In-App Analytics & Visualization Strategy** | Development of a custom, privacy-first analytics dashboard to visualize user engagement and system health. | Accepted |
| [002](./002-serverless-backend-architecture.md) | **Serverless Backend Architecture** | Selection of Azure Functions for a zero-maintenance, event-driven, and cost-effective backend. | Accepted |
| [001](./001-design-first-methodology.md) | **Design-First Methodology** | Adoption of a contract-first approach to ensure data modeling accuracy and structural integrity. | Accepted |

---

## 📄 ADR Template

New architectural decisions should follow the structure below:

```markdown
# ADR 00X: Descriptive Title

- **Status:** Proposed | Accepted | Superseded
- **Date:** YYYY-MM-DD
- **Author:** Victoria Cheng

## Context and Problem Statement

What specific issue triggered this change?

## Decision Outcome

What was the chosen architectural path?

## Consequences

### Positive

- **Benefit 1:** Description

### Negative

- **Drawback 1:** Description

## Verification

- [ ] **Manual Check:** (e.g., Verified logs/UI locally).
- [ ] **Automated Tests:** (e.g., `make nix-go-test` passed).
```
