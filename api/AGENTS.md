# API Agents

This document outlines the primary components (agents) of the Cover Craft API.

## Project Overview

The `api` project is a serverless backend built with TypeScript and Azure Functions. Its primary role is to handle the heavy lifting of image generation, data persistence, and analytics aggregation, exposing these capabilities to the frontend via HTTP endpoints. It uses `node-canvas` for server-side image rendering and `mongoose` to interact with a MongoDB database.

## Core Components

The API is structured into several key areas of responsibility:

### 1. HTTP Functions (`/src/functions`)

These are the public-facing endpoints of the API, triggered by HTTP requests.

- **`generateCoverImage`**: The core endpoint of the application. It receives image parameters (dimensions, colors, text), validates them against shared rules, generates a PNG image using `node-canvas`, and returns it to the client. It also records detailed success, validation failure, or error metrics for each attempt.
- **`analytics`**: An endpoint that serves pre-aggregated analytics data. It uses the queries defined in `analyticsQueries.ts` to provide insights into user engagement, feature popularity, and performance.
- **`metrics`**: A data ingestion endpoint that receives event payloads (like `generate_click`) from the frontend and stores them in MongoDB for later analysis.
- **`healthCheck`**: A simple endpoint that returns a `200 OK` response to indicate that the API is running and responsive.

### 2. Business Logic & Data Access (`/src/lib`)

This layer contains the internal logic and data handling for the functions.

- **`analyticsQueries.ts`**: The analytics engine of the API. It contains complex MongoDB aggregation pipelines to process raw metrics into meaningful insights, such as trends, top-used features, and performance percentiles (P95/P99).
- **`mongoose.ts`**: The data access layer. It manages the connection to MongoDB and defines the `metricSchema`, which is the Mongoose schema for all stored event and metric data.
- **`fontConfig.ts`**: A configuration file that maps the font families available in the UI to the actual font files stored in `/src/assets`. This allows the `node-canvas` library to load and use custom fonts during image generation.

### 3. Shared Code (`/src/shared`)

This directory contains code that is directly shared with the `/frontend` project to ensure consistency across the full stack.

- **`validators.ts`**: A crucial set of validation functions and constants (e.g., max title length, allowed fonts, color regex) used by both the client and server to ensure data integrity.
- **`metricPayload.ts`**: Defines the data contracts (TypeScript types) for the event payloads sent from the frontend to the `/api/metrics` endpoint.
- **`analytics.ts`**: Defines the data contracts for the complex analytics objects returned by the `/api/analytics` endpoint.

## Key Scripts

The `package.json` file in this directory defines scripts to manage the API project lifecycle:

- **`npm run build`**: Compiles the TypeScript code, copies shared files, and prepares the project to be run by the Azure Functions host.
- **`npm run start`**: Starts the local Azure Functions development server (`func start`).
- **`npm run test`**: Executes the unit and integration tests for the API using Vitest.
