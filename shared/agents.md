# Shared Agents

This document outlines the purpose and components of the `shared` library.

## Project Overview

The `shared` project is a TypeScript library that contains code shared between the `/frontend` and `/api` projects. Its primary purpose is to enforce consistency, ensure type safety, and eliminate code duplication across the entire application stack. By providing a single source of truth for validation rules and data contracts, it plays a critical role in maintaining the integrity and reliability of the monorepo.

## Core Components

### 1. `validators.ts`

This is the single source of truth for all validation logic in the application. It defines the rules that govern the data exchanged between the frontend and the backend.

- **Responsibility**: Exports constants (e.g., `MAX_TITLE_LENGTH`, `FONT_OPTIONS`), validation functions (`validateColors`, `validateContrast`), and utility functions (`hexToRgb`).
- **Impact**: Ensures that what the user sees on the frontend (e.g., a character limit) is identical to what the backend enforces. This prevents discrepancies and bugs arising from duplicated or out-of-sync logic.

### 2. `metricPayload.ts`

This file defines the data contracts for all analytics and event-tracking payloads.

- **Responsibility**: Exports TypeScript types (`MetricPayload`, `EventType`, `MetricStatus`) and constants that define the structure of the data sent from the frontend to the `/api/metrics` endpoint.
- **Impact**: Guarantees that both the client and server agree on the "language" of analytics, preventing data ingestion errors and ensuring that all tracked events are structured correctly.

### 3. `analytics.ts`

This file defines the TypeScript types for the complex data structures returned by the `/api/analytics` endpoint.

- **Responsibility**: Exports types that model the shape of the aggregated analytics data (e.g., `AnalyticsResult`, `UserEngagement`, `PerformanceMetrics`).
- **Impact**: Provides strong type safety for the frontend when it consumes analytics data, which enables robust development of the analytics dashboard and reduces the risk of runtime errors.

### 4. `tsconfig.json`

This is the dedicated TypeScript configuration file for the `shared` library, specifying how the code should be compiled into distributable JavaScript.

## Build Process

The `shared` library is not a standalone application. Instead, it is compiled as part of the `api` project's build process (`npm run build:shared`). The resulting JavaScript files are then consumed by both the `api` and `frontend` projects, allowing them to import from this central, shared codebase.
