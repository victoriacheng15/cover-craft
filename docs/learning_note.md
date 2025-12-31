# 🧭 Engineering Journal

Technical challenges, architectural decisions, and key learnings from building the **Cover Craft** platform.

## 🏗️ Architecture & Infrastructure

| Challenge | Solution | Key Takeaway |
| :--- | :--- | :--- |
| **Serverless Deployment** | Automated deployment to **Azure Functions** using GitHub Actions and `config-zip`. | Serverless is ideal for event-driven workloads (image generation) but requires careful cold-start management. |
| **Secret Management** | Implemented strict `.funcignore` rules and used Azure App Settings for production credentials. | Never rely on `local.settings.json` in production; infrastructure-as-code principles prevent leaks. |
| **Multi-Cloud Hosting** | Decoupled Frontend (Vercel) from Backend (Azure) using Next.js API Routes as a proxy. | Proxy patterns allow flexibility in backend hosting without exposing infrastructure details to the client. |

## 🎨 Rendering & Validation Logic

| Challenge | Solution | Key Takeaway |
| :--- | :--- | :--- |
| **Server-Side Rendering** | Leveraged `node-canvas` to generate high-fidelity PNGs on the backend, ensuring consistency across devices. | Backend rendering guarantees pixel-perfect output but adds memory overhead that must be monitored. |
| **WCAG Compliance** | Built a shared validation library (`shared/validators.ts`) to enforce 4.5:1 contrast ratios before generation. | Accessibility checks should be "shift-left"—validated at the API boundary, not just the UI. |
| **Font Consistency** | mapped Google Fonts in Next.js to CSS variables, ensuring the live preview matches the backend canvas render. | Hybrid rendering (CSS preview + Canvas output) offers the best UX: instant feedback with zero server load until final generation. |

## 📊 Data & Analytics

| Challenge | Solution | Key Takeaway |
| :--- | :--- | :--- |
| **Event Ingestion** | Designed a strongly-typed `MetricPayload` schema to capture granular performance and usage data. | Strong typing at the ingestion layer prevents data swamps and simplifies downstream analysis. |
| **Complex Aggregation** | Utilized MongoDB's Aggregation Pipeline for calculating percentiles (P95/P99) and trends on the fly. | Moving computation to the database layer (via Aggregation) is significantly faster than processing raw logs in application code. |

## 🔮 Future Improvements

- **Caching:** Implement Azure Redis Cache for frequently generated default covers.
- **Queueing:** Move heavy rendering tasks to Azure Storage Queues for better concurrency handling.
- **Edge Function:** Migrate lightweight validation logic to the Edge to reduce latency.
