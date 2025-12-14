# Cover Craft 🎨

A full-stack cover image generator application with built-in analytics dashboard. Showcases modern web development, cloud deployment, and best practices. Demonstrates end-to-end integration of responsive frontend, serverless backend, MongoDB data persistence, and cloud infrastructure for production-ready applications.

## 🧰 Tech Stack

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6.svg?style=for-the-badge&logo=TypeScript&logoColor=white) ![Next.js](https://img.shields.io/badge/Next.js-000000.svg?style=for-the-badge&logo=nextdotjs&logoColor=white) ![React](https://img.shields.io/badge/React-61DAFB.svg?style=for-the-badge&logo=React&logoColor=black) ![Tailwind%20CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4.svg?style=for-the-badge&logo=Tailwind-CSS&logoColor=white) ![Azure%20Functions](https://img.shields.io/badge/Azure%20Functions-0078D4.svg?style=for-the-badge&logo=Azure-Functions&logoColor=white) ![MongoDB](https://img.shields.io/badge/MongoDB-47A248.svg?style=for-the-badge&logo=MongoDB&logoColor=white) ![Vercel](https://img.shields.io/badge/Vercel-000000.svg?style=for-the-badge&logo=Vercel&logoColor=white) ![Vitest](https://img.shields.io/badge/Vitest-6E9F18.svg?style=for-the-badge&logo=Vitest&logoColor=white) ![Biome](https://img.shields.io/badge/Biome-60A5FA.svg?style=for-the-badge&logo=Biome&logoColor=white)

## 🌍 Deployment

- **Frontend**: [Vercel](https://vercel.com) - Optimized for Next.js with automatic deployments on push
- **Backend**: Azure Function App - Serverless execution of image generation and analytics APIs
- **Database**: MongoDB - Cloud-hosted for analytics data persistence

## 📚 Documentation

- [Frontend Architecture](./docs/frontend_architecture.md): Component structure, hooks, state management, accessibility
- [Backend Architecture](./docs/backend_architecture.md): Azure Functions, image generation, APIs
- [DevOps Practices](./docs/devops_practice.md): Deployment strategies, CI/CD pipelines, infrastructure
- [Learning Notes](./docs/learning_note.md): Key insights from development and deployment

## ⚙️ What It Does

1. **Cover Image Generation**: Create custom cover images with customizable text, colors, fonts, and size presets
2. **Real-time Preview**: See changes instantly as you adjust design parameters
3. **Color Contrast Validation**: WCAG AA compliance checking ensures all generated images are accessible (≥ 4.5:1 contrast ratio)
4. **Activity Tracking**: All generate and download actions are logged to MongoDB
5. **Advanced Analytics Dashboard**: `/analytics` route displays comprehensive, interactive metrics:
   - **Key Metrics**: Total clicks, generate/download breakdown, unique users, conversion rate, and more
   - **Trends**: 12-month and 30-day activity, hourly and subtitle usage trends
   - **Feature Popularity**: Font, size, and subtitle usage, title length stats
   - **Accessibility**: WCAG level distribution, contrast ratio stats, failure rates, and trends
   - **Performance**: Backend/client duration, network latency, percentiles, and performance by image size
   - **Reusable KPICard**: Unified metric display with 8 color variants and dynamic formatting
   - **Interactive Charts**: Line, bar, and pie charts (recharts)
   - **Array-Map Patterns**: Modular, maintainable code for metrics and cards
   - **Test Coverage**: All analytics features covered by unit tests

## 🚀 Key Features & Technical Highlights

### Frontend Architecture

- **Full-Stack TypeScript**: Type-safe code from frontend to backend
- **React Components**: Modular, reusable UI components with proper separation of concerns
- **Real-time Preview**: Instant updates as users customize designs
- **Color Contrast Validation**: Debounced WCAG AA compliance checking with real-time visual feedback
- **Responsive Design**: Mobile-first approach with optimized layouts
- **Custom Hooks**: `useAnalytics` for data fetching, `useContrastCheck` for accessibility validation
- **Accessibility**: WCAG 2.1 AA compliant with semantic HTML, ARIA attributes, and contrast validation

### Backend Architecture

- **Serverless Azure Functions**: Scalable, cost-efficient image generation
- **Node.js Canvas**: High-quality PNG rendering
- **WCAG Color Contrast Validation**: Ensures all generated images meet accessibility standards (≥ 4.5:1 ratio)
- **MongoDB Integration**: Analytics data persistence and aggregation
- **API Endpoints**: RESTful design for image generation and analytics queries

### Code Quality & Deployment

- **Comprehensive Testing**: Unit tests for both frontend (Vitest) and backend
- **Code Quality**: Automated linting and formatting with Biome
- **Multi-Cloud Deployment**: Frontend on Vercel, backend on Azure Function App
- **CI/CD Ready**: Automated testing and deployment pipelines

## 🧠 Why This Project

This project demonstrates:

- ✅ **Full-stack TypeScript** application with end-to-end type safety
- ✅ **Serverless architecture** handling concurrent requests efficiently
- ✅ **Multi-cloud integration** (Vercel + Azure) with production-ready configuration
- ✅ **Data analytics** from collection to visualization
- ✅ **Comprehensive testing** and code quality standards
- ✅ **WCAG 2.1 AA accessibility** compliance
- ✅ **Clean, maintainable codebase** with clear documentation

## 📂 Project Structure

```plaintext
cover-craft/
├── frontend/                  # Next.js frontend app (UI, analytics, hooks, components)
│   ├── src/
│   │   ├── app/               # Next.js app router pages (incl. analytics)
│   │   ├── components/        # React UI components (form, layout, preview, ui)
│   │   ├── hooks/             # Custom React hooks (analytics, form, contrast)
│   │   └── lib/               # Utilities, fonts, helpers
│   ├── public/                # Static assets (images, fonts)
│   ├── coverage/              # Frontend test coverage reports
│   └── ...                    # Config, docs, etc.
├── api/                       # Azure Functions backend (serverless)
│   ├── src/
│   │   ├── functions/         # API endpoints (analytics, image generation, health)
│   │   ├── lib/               # Backend utilities (e.g. mongoose)
│   │   └── shared/            # Shared types/validators (symlinked from root)
│   └── ...                    # Config, local.settings.json, etc.
├── shared/                    # TypeScript types, validators, metric payloads (shared)
├── script/                    # Utility scripts (e.g. check_responses.sh)
├── docs/                      # Architecture and development docs
├── README.md                  # This file
├── package.json, etc.         # Root config/metadata
└── ...                        # Other project files
```

## 📊 Analytics Dashboard

The `/analytics` page provides real-time, interactive insights into user engagement, feature usage, accessibility, and performance. **All data is persisted in MongoDB and aggregated on-demand.**

> **Privacy Note:** The analytics system does **not** collect any personal data, browser/device information, or IP addresses. Only pure user input data (cover generation and download actions, selected options, etc.) is tracked for aggregate metrics.

**Dashboard Includes:**
- **User Engagement**: Total clicks, generate/download breakdown, unique users, conversion rate
- **Activity Trends**: 12-month, 30-day, and hourly trends with subtitle usage tracking
- **Feature Popularity**: Font and size distribution, title length statistics
- **Accessibility Metrics**: WCAG compliance levels, contrast ratio statistics, 30-day trends
- **Performance Analytics**: Backend/client duration, network latency, percentiles (P50/P95/P99), performance by image size

**Built with:** Reusable KPICard components (8 color variants), interactive charts (recharts), and comprehensive test coverage. See [Analytics Dashboard Components](./docs/frontend_architecture.md#analytics-dashboard-components) in the frontend architecture docs for implementation details.

## 🏃 Getting Started

### Prerequisites

- Node.js 22+ (LTS recommended, tested on Node 24)
- npm or yarn
- Azure Functions Core Tools (for local backend development)
- MongoDB connection string (for analytics features)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/victoriacheng15/cover-craft.git
cd cover-craft
```

2. Install dependencies:

```bash
# Frontend
cd frontend && npm install && cd ..

# Backend
cd api && npm install && cd ..
```

### Running Locally

**Terminal 1 - Frontend:**

```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000`

**Terminal 2 - Backend:**

```bash
cd api
npm run prestart  # Compile TypeScript
npm start         # Start Azure Functions locally
```

Backend available at `http://localhost:7071`

## 🧪 Testing & Code Quality

```bash
# Frontend
cd frontend
npm run test      # Run tests
npm run lint      # Lint code
npm run format    # Format code

# Backend
cd api
npm run test      # Run tests
npm run lint      # Lint code
```

## ♿ Accessibility

This project is built with accessibility in mind:

- Semantic HTML and ARIA attributes
- WCAG 2.1 AA color contrast ratios
- Screen reader announcements for dynamic content
- Visible focus indicators

See [Accessibility Standards](./docs/frontend_architecture.md#accessibility-standards) in the frontend architecture documentation for details.
