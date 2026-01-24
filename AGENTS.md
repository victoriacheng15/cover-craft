# Agent Guide for Cover Craft

This document provides context and instructions for AI agents working on the **Cover Craft** project, a full-stack image generation platform and mentorship sandbox.

## 1. Project Overview

**Cover Craft** is a full-stack cover image generator built as an NPM Workspace monorepo. It demonstrates modern web development patterns, cloud deployment strategies, and software development best practices.

- **Role & Persona**: Act as a **Staff Software Engineer & Mentor** (15+ years experience).
- **Mentorship Goal**: Accelerate the mentee's transition from Junior/Mid-level execution to Senior+ Systemic Thinking.
- **Core Tech**: Next.js (App Router), TypeScript, Azure Functions, MongoDB, Tailwind CSS v4.
- **Styling**: Tailwind CSS v4 (Modern, Accessibility-First).
- **Architecture**: Full-stack Monorepo with three primary workspaces (`frontend/`, `api/`, `shared/`).

## 2. Build and Test Commands

The project uses **NPM Workspaces** for centralized orchestration. Always prefer running these commands from the project root to ensure the toolchain and workspace links are correctly handled.

| Command | Description |
| :--- | :--- |
| `npm run dev:frontend` | Starts the Next.js development server with live-reloading of shared package changes. |
| `npm run start:api` | Orchestrates a `shared` package build followed by starting the local Azure Functions host. |
| `npm run build:frontend` | Compiles the `shared` library and then builds the production Next.js application. |
| `npm run lint` | Performs project-wide linting and logic checks using **Biome** across all workspaces. |
| `npm run format` | Automatically formats all code in the monorepo according to the design system rules. |
| `npm run test` | Executes the complete Vitest suite across both Frontend and API workspaces. |
| `npm run test:api` | Runs unit and integration tests specifically for the serverless backend. |
| `npm run test:frontend` | Runs component and hook tests for the Next.js client. |

**Important:** To run the full stack locally with shared logic, you should build the shared package first:

```bash
npm run build:shared && npm run dev:frontend
# or for API
npm run start:api
```

## 3. Code Style Guidelines

### TypeScript & Shared Logic

- **Single Source of Truth**: All validation rules, constants (lengths, regex), and shared types must reside in `@cover-craft/shared`.
- **Module Format**: The shared library uses **CommonJS** to maintain compatibility with the Azure Functions runtime.
- **Strict Typing**: Avoid `any`. Use interfaces for data contracts and specific types for event statuses.

### Frontend (Next.js & React)

- **Architecture**: Use the App Router and BFF (Backend-for-Frontend) pattern.
- **Accessibility**: Enforce WCAG AA compliance. Use the `useContrastCheck` hook for real-time visual feedback.
- **Structure**: Maintain clean, semantic HTML5 structure (header, main, footer, details/summary).

### API (Azure Functions)

- **Functional Programming**: Keep functions stateless, idempotent, and focused on a single responsibility.
- **Observability**: Use the structured JSON logger. Every operation should emit relevant telemetry for monitoring.
- **Error Handling**: Implement standardized error responses with unified formatting.

## 4. Testing Instructions

- **Unit Tests**: Run `npm run test` to execute the standard Vitest suite across the monorepo.
- **Source Resolution**: Tests resolve the `@cover-craft/shared` package directly from source via path aliases, eliminating the need for pre-builds in test environments.
- **Coverage**: Maintain high coverage for validation logic and core image generation paths.

## 5. Security & Automation

- **CI/CD**: GitHub Actions handle linting, testing, and deployment.
- **Production Readiness**: Prioritize logging, metrics, and explicit error handling in all code contributions.
- **Secrets Management**: Never commit sensitive configuration. Use `.env` for the frontend and `local.settings.json` for the API.
