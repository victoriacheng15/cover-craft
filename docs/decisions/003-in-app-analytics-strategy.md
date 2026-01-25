# ADR 003: In-App Analytics # ADR 002: In-App Analytics & Visualization Strategy Visualization Strategy

- **Status:** Accepted
- **Date:** 2025-12-13
- **Author:** Victoria Cheng

## Context and Problem Statement

The entire analytics initiative began with **curiosity**: How are users actually interacting with the tool? Which features are most popular? This curiosity drove the decision to design the backend to send raw telemetry data to MongoDB. Consequently, a visualization layer was needed to transform this raw data into actionable insights, satisfying the original intent without compromising user privacy via third-party trackers.

## Decision Outcome

A **Custom In-App Analytics Dashboard** was built using React and Recharts, integrated directly into the Next.js frontend.

- **Custom Transformation Logic:** Raw telemetry data is fetched and transformed on the client-side (via `useAnalytics`) to calculate trends, feature popularity, and accessibility scores.
- **Privacy-First Visualization:** Processing data within the internal domain ensures no user data is shared with external vendors.
- **Unified UX:** The dashboard lives within the application (`/analytics`), providing transparency to users about tracked anonymized metrics.

## Consequences

- **Positive:**
  - Complete control over data visualization and aggregation logic (e.g., handling synthetic traffic for statistical significance).
  - Zero cost for visualization tools (compared to SaaS dashboards).
  - Seamless integration with the existing component system (UI consistency).
- **Negative/Trade-offs:**
  - Development effort required to build and maintain charts and data hooks.
  - Client-side data transformation can be heavy if the dataset grows significantly (may need server-side aggregation in the future).

## Verification

- [x] **Manual Check:** Validated the `/analytics` page renders correct trends and charts.
- [x] **Automated Tests:**
  - **Data Transformation:** `frontend/src/hooks/useAnalytics.test.ts` verified that raw API responses are correctly mapped to chart data.
  - **Dashboard Components:** `frontend/src/app/analytics/_components/UserEngagement.tsx` (and siblings) are tested for rendering accuracy.
