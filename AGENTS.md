# Cover Craft Agents

This document outlines the primary components (agents) of the Cover Craft application.

## Project Overview

Cover Craft is a full-stack cover image generator application that demonstrates modern web development patterns, cloud deployment strategies, and software development best practices. The project is built with a strong emphasis on accessibility, observability, and maintainability.

- **🎨 Enforced Contrast:** The tool won’t generate an image if the text and background colors fail accessibility readability checks.
- **🖼️ Server-Rendered:** Images are generated on the backend for consistent rendering.
- **📊 Observable:** Anonymized usage metrics help improve the tool without tracking individual users.

## Core Components

The application is architected as a monorepo with the following distinct components:

### 1. Frontend (`/frontend`)

- **Technology**: Next.js, React, Tailwind CSS
- **Responsibility**: Provides the user interface for generating cover images. It includes a live preview and a form for customization. It also features an analytics dashboard to display usage metrics.
- **Key Features**:
  - Real-time CSS-driven preview.
  - Integrated WCAG AA contrast validation.
  - Analytics dashboard for visualizing usage data.

### 2. API (`/api`)

- **Technology**: Azure Functions, TypeScript
- **Responsibility**: A serverless backend responsible for generating images and collecting metrics.
- **Key Features**:
  - Server-side PNG rendering with custom fonts and colors.
  - Anonymized analytics and performance metrics collection.
  - MongoDB integration for data persistence.

### 3. Shared (`/shared`)

- **Technology**: TypeScript
- **Responsibility**: A dedicated library that provides shared code, such as type definitions and validation logic, for both the frontend and API. This ensures consistency and type safety across the entire stack.

### 4. Documentation (`/docs`)

- **Philosophy**: "Documentation as Code"
- **Content**: This directory contains all technical documentation for the project, including architectural diagrams, operational guides, and learning notes.

## Key Scripts

The `package.json` at the root of the project provides the following scripts for managing the monorepo:

- `npm run lint`: Lints and formats the code in `frontend`, `api`, and `shared`.
- `npm run format`: Formats the code across the monorepo.
- `npm run test`: Runs the test suites for both `api` and `frontend`.
- `npm run test:api`: Runs the test suite for the API component.
- `npm run test:frontend`: Runs the test suite for the frontend component.
