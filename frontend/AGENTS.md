# Frontend Agents

This document outlines the primary components (agents) of the Cover Craft frontend application.

## Project Overview

The `frontend` project is a modern web application built with Next.js, React, and Tailwind CSS. It serves as the primary user interface for the Cover Craft service. Its responsibilities include providing an interactive form for image generation, rendering a real-time preview, and displaying a comprehensive analytics dashboard.

## Core Components

The frontend is architected using the Next.js App Router and is composed of several distinct types of components:

### 1. Pages (`/src/app`)

These are the main entry points for users, defining the different views of the application.

- **/ (Landing Page)**: The main entry point of the application, introducing the tool and its principles.
- **/generate**: The core user-facing feature where users can design and generate their cover images. It hosts the `CoverForm` and `CoverPreviewDisplay` components.
- **/analytics**: The analytics dashboard page. It uses data-fetching hooks (`useAnalytics`) and a charting library (`recharts`) to visualize application usage metrics.
- **/evolution**: A static page that presents a timeline of the project's development and key architectural decisions.

### 2. API Routes - Backend for Frontend (BFF) (`/src/app/api`)

These are server-side Next.js Route Handlers that act as a proxy between the client and the main Azure Functions API. This BFF pattern simplifies frontend data fetching, abstracts away the backend's complexity, and securely handles environment variables.

- **/api/generateCoverImage**: Proxies the image generation request to the backend API.
- **/api/metrics**: Forwards client-side metric payloads to the backend.
- **/api/analytics**: Fetches the aggregated analytics data for the dashboard.
- **/api/health**: Checks the health of the backend API.

### 3. UI Components (`/src/components`)

The UI is broken down into a hierarchical component structure.

- **Feature Components (`/form`, `/preview`)**: These are high-level components tied to specific features.
  - `CoverForm.tsx`: The main interactive form for customizing the cover image. It is composed of smaller controls.
  - `CoverPreviewDisplay.tsx`: Renders either the live preview or the final generated image.
- **Layout Components (`/layout`)**: These components define the global structure of the application.
  - `Header.tsx`, `Footer.tsx`, `MainLayout.tsx`.
- **Core UI Library (`/ui`)**: This is the design system of the application, containing reusable, presentation-focused components.
  - Examples: `Button.tsx`, `Card.tsx`, `ColorPicker.tsx`, `Input.tsx`, `Select.tsx`, `KPICard.tsx`.

### 4. State Management & Logic (`/src/hooks`)

Custom React hooks are used to encapsulate and manage complex state and logic.

- **`useForm.ts`**: Manages the entire state of the image generation form, including all input values, validation, and the submission process.
- **`useAnalytics.ts`**: Handles the fetching, caching, and state management of the analytics data from the BFF.
- **`useContrastCheck.ts`**: Provides real-time WCAG contrast ratio validation as the user selects colors, giving immediate accessibility feedback.

### 5. Libraries & Utilities (`/src/lib`)

This directory contains shared configurations and helper functions specific to the frontend.

- **`fonts.ts`**: Configures and exports the fonts used throughout the application via `next/font`, ensuring optimal performance.
- **`utils.ts`**: A collection of miscellaneous utility functions, like `cn` for combining CSS classes.

## Key Scripts

- **`npm run dev`**: Starts the Next.js development server with hot-reloading.
- **`npm run build`**: Creates a production-optimized build of the application.
- **`npm run start`**: Starts the production server for the built application.
- **`npm run test`**: Runs the unit and component test suite using Vitest and React Testing Library.
