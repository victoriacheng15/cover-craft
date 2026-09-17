# Frontend Architecture

The frontend is a **Next.js (App Router)** application that provides interactive creation workflows for single cover images, high-throughput batch generation, and animated GIF slideshows. It is hosted on **Azure Web Apps (Linux F1 Tier)** and uses a **Proxy Layer** to communicate with the Azure Functions backend, ensuring the client remains decoupled from the serverless infrastructure.

## Core Tech Stack

- **Framework:** Next.js 15+ (App Router)
- **Hosting:** Azure Web Apps (Linux)
- **Infrastructure:** OpenTofu / Terraform (IaC)
- **Styling:** Tailwind CSS + CSS Variables (for dynamic font injection)
- **State:** React Hooks (`useState`, `useMemo`, `useCallback`)
- **Metrics:** Recharts (for analytics visualization)
- **Contracts & Types:** OpenAPI 3.1.0 client types generated via `make contract-sync`

## System Architecture

The frontend orchestrates three generation workflows: direct rendering for single image previews, polling-based retrieval for batch jobs, and synchronous rendering for animated GIF slideshows.

```text
┌──────────────────────────────────────────────────────────────────┐
│                         Client Browser                           │
└──────────────────────────────────────────────────────────────────┘
         │                      │                      │
         │ 1. Preview / GIF     │ 2. Submit Batch      │ 3. Status
         ▼                      ▼                      ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Next.js Proxy Layer (BFF)                      │
│            (Secures API keys and prevents CORS issues)           │
└──────────────────────────────────────────────────────────────────┘
         │                      │                      │
         │ /generateImage,      │ /generateImages      │ /jobStatus
         │ /generateGif         ▼                      ▼
         ▼             ┌──────────────────┐   ┌──────────────────┐
┌──────────────────┐   │   Go Function    │   │   Go Function    │
│   Go Function    │   │ (QueueProducer)  │   │  (GetJobStatus)  │
│(Image/GifRender) │   └──────────────────┘   └──────────────────┘
└──────────────────┘
```

## Architectural Patterns

### 1. The Proxy Pattern (BFF)

All client requests to image generation, animated GIF creation, analytics, or job status endpoints are handled by Next.js route handlers.

- **Benefit:** Hides Azure Function host keys, prevents CORS issues, and allows for request/response transformation (e.g., error mapping) before reaching the client.

### 2. Multi-Mode Generation

- **Synchronous Single Cover:** The `useForm` hook triggers a direct request to `/api/generateImage` for instantaneous visual feedback and single-image downloads.
- **Asynchronous Batch Processing:** The `useBatchForm` hook submits a bulk request to `/api/generateImages`, receives a `jobId`, and initiates a polling lifecycle to track progress until completion.
- **Synchronous GIF Slideshow:** The `useGifForm` hook manages multi-slide configuration (2 to 10 slides), frame delays (1000ms to 3000ms), and calls `/api/generateGif` for real-time animated GIF rendering.

### 3. Progressive UI Updates

- **Skeleton Loaders:** Standardized across analytics and batch result components to eliminate layout shifts during asynchronous data fetching.
- **Batch Results Display:** Dynamically renders generated assets as they become available via the polling mechanism, providing real-time progress visualization.

## Component Structure

| Type | Examples | Responsibility |
| :--- | :--- | :--- |
| **Pages** | `generate/page.tsx`, `generate/batch/page.tsx`, `generate/slideshow/page.tsx`, `analytics/page.tsx` | Entry points for single cover, batch generation, GIF slideshows, and telemetry dashboards. |
| **Navigation** | `GenerationNav` | Contextual navigation bar to toggle between Single Cover, Bulk Batch, and GIF Slideshow modes. |
| **Batch UI** | `BatchFormControls`, `BatchResultsDisplay` | Specialized components for bulk parameter configuration and result visualization. |
| **GIF UI** | `GifForm`, `GifFormControls`, `GifSettingsControls`, `GifPreviewDisplay` | Slide list orchestration, frame delay sliders, and animated preview rendering. |
| **Forms** | `CoverForm`, `FormField` | Encapsulates input logic, contrast validation, and single-image preview synchronization. |
| **UI** | `Button`, `Card`, `Skeleton` | Stateless, reusable atoms styled with Tailwind. |

## Custom Hooks (The Logic Layer)

| Hook | Source | Responsibility |
| :--- | :--- | :--- |
| `useForm` | `hooks/useForm.ts` | Orchestrates single-image state, preview synchronization, and download workflow. |
| `useBatchForm` | `hooks/useBatchForm.ts` | Manages bulk job submission, status polling, and result aggregation. |
| `useGifForm` | `hooks/useGifForm.ts` | Manages slide deck array state, slide reordering, delay controls, and GIF preview generation. |
| `useContrastCheck` | `hooks/useContrastCheck.ts` | Performs debounced (300ms) WCAG AA compliance checks on color pairs. |
| `useAnalytics` | `hooks/useAnalytics.ts` | Fetches aggregated telemetry reports and tracks client-side user events. |

## Data Models

### Batch Job State

```typescript
interface BatchJobState {
  jobId: string | null;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number; // processed / total * 100
  results: Array<{ url: string; fileName: string }>;
  error?: string;
}
```

## Accessibility & Validation

- **WCAG AA Enforced:** Generation buttons (Single Cover, Batch, and GIF Slideshow) are programmatically disabled unless contrast ratios meet the ≥ 4.5:1 threshold.
- **Live Regions:** Uses `aria-live="polite"` for batch progress updates to ensure screen readers are notified of background job completion.
- **Focus Management:** Ensures consistent keyboard navigation during the transition from form submission to result display.
