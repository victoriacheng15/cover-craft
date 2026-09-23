# Frontend Architecture

The frontend is a **Next.js (App Router)** application that provides interactive creation workflows for single cover images, multi-slide carousels, and animated GIF slideshows. It is hosted on **Azure Web Apps (Linux F1 Tier)** and uses a **Proxy Layer** to communicate with the Azure Functions backend, ensuring the client remains decoupled from the serverless infrastructure.

## Core Tech Stack

- **Framework:** Next.js 15+ (App Router)
- **Hosting:** Azure Web Apps (Linux)
- **Infrastructure:** OpenTofu / Terraform (IaC)
- **Styling:** Tailwind CSS + CSS Variables (for dynamic font injection)
- **State:** React Hooks (`useState`, `useMemo`, `useCallback`)
- **Metrics:** Recharts (for analytics visualization)
- **Contracts & Types:** OpenAPI 3.1.0 client types generated via `make contract-sync`

## System Architecture

The frontend orchestrates three generation workflows: direct rendering for single image previews, polling-based retrieval for asynchronous carousel jobs, and synchronous rendering for animated GIF slideshows.

```text
┌──────────────────────────────────────────────────────────────────┐
│                         Client Browser                           │
└──────────────────────────────────────────────────────────────────┘
         │                      │                      │
         │ 1. Preview / GIF     │ 2. Submit Carousel   │ 3. Status
         ▼                      ▼                      ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Next.js Proxy Layer (BFF)                      │
│            (Secures API keys and prevents CORS issues)           │
└──────────────────────────────────────────────────────────────────┘
         │                      │                      │
         │ /generateImage,      │ /generateCarousel    │ /jobStatus
         │ /generateGif         ▼                      ▼
         ▼             ┌──────────────────┐   ┌──────────────────┐
┌──────────────────┐   │   Go Function    │   │   Go Function    │
│   Go Function    │   │(CarouselProducer)│   │  (GetJobStatus)  │
│(Image/GifRender) │   └──────────────────┘   └──────────────────┘
└──────────────────┘
```

## Architectural Patterns

### 1. The Proxy Pattern (BFF)

All client requests to image generation, carousel compilation, animated GIF creation, analytics, or job status endpoints are handled by Next.js route handlers.

- **Benefit:** Hides Azure Function host keys, prevents CORS issues, and allows for request/response transformation (e.g., error mapping) before reaching the client.

### 2. Multi-Mode Generation

- **Synchronous Single Cover:** The `useForm` hook triggers a direct request to `/api/generateImage` for instantaneous visual feedback and single-image downloads.
- **Asynchronous Carousel Generation:** The `useCarouselForm` hook manages deck settings (aspect ratio, font, global colors) and per-slide content (title, subtitle vs. list, layout alignments), submits requests to `/api/generateCarousel`, receives a `jobId`, and polls `/api/jobStatus` until multi-page PDF and slide images are ready.
- **Synchronous GIF Slideshow:** The `useGifForm` hook manages multi-slide configuration (2 to 10 slides), frame delays (1000ms to 3000ms), and calls `/api/generateGif` for real-time animated GIF rendering.

### 3. Progressive UI Updates & Canvas Parity

- **Live HTML5 Canvas Preview:** Renders slide content with client-side canvas routines that match backend text metrics, font wrapping, bullet offsets, and safe-zone borders.
- **Skeleton Loaders:** Standardized across analytics and preview components to eliminate layout shifts during asynchronous data fetching.
- **Filmstrip Navigation:** Enables thumbnail previewing, slide reordering, adding, and removing slides in real time.

## Component Structure

| Type | Examples | Responsibility |
| :--- | :--- | :--- |
| **Pages** | `generate/page.tsx`, `generate/carousel/page.tsx`, `generate/slideshow/page.tsx`, `analytics/page.tsx` | Entry points for single cover, carousel generation, GIF slideshows, and telemetry dashboards. |
| **Navigation** | `GenerationNav` | Contextual navigation bar to toggle between Single Cover, Carousel Builder, and GIF Slideshow modes. |
| **Carousel UI** | `CarouselForm`, `CarouselFormControls`, `CarouselPreviewDisplay` | Filmstrip slide selector, subtitle vs bulleted list switcher, layout alignment, and live canvas preview. |
| **GIF UI** | `GifForm`, `GifFormControls`, `GifSettingsControls`, `GifPreviewDisplay` | Slide list orchestration, frame delay sliders, and animated preview rendering. |
| **Forms** | `CoverForm`, `FormField` | Encapsulates input logic, contrast validation, and single-image preview synchronization. |
| **UI** | `Button`, `Card`, `Skeleton` | Stateless, reusable atoms styled with Tailwind. |

## Custom Hooks (The Logic Layer)

| Hook | Source | Responsibility |
| :--- | :--- | :--- |
| `useForm` | `hooks/useForm.ts` | Orchestrates single-image state, preview synchronization, and download workflow. |
| `useCarouselForm` | `hooks/useCarouselForm.ts` | Manages carousel deck configuration, slide addition/removal/reordering, canvas preview synchronization, and PDF job lifecycle. |
| `useGifForm` | `hooks/useGifForm.ts` | Manages slide deck array state, slide reordering, delay controls, and GIF preview generation. |
| `useContrastCheck` | `hooks/useContrastCheck.ts` | Performs debounced (300ms) WCAG AA compliance checks on color pairs. |
| `useAnalytics` | `hooks/useAnalytics.ts` | Fetches aggregated telemetry reports and tracks client-side user events. |

## Data Models

### Carousel Job State

```typescript
interface CarouselJobState {
  jobId: string | null;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  total: number;
  pdfUrl?: string;
  results: string[];
  error?: string;
}
```

## Accessibility & Validation

- **WCAG AA Enforced:** Generation buttons (Single Cover, Carousel Builder, and GIF Slideshow) are programmatically disabled unless contrast ratios meet the ≥ 4.5:1 threshold.
- **Live Regions:** Uses `aria-live="polite"` for carousel progress updates to ensure screen readers are notified of background job completion.
- **Focus Management:** Ensures consistent keyboard navigation during slide switching and modal transitions.
