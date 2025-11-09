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
3. **Activity Tracking**: All generate and download actions are logged to MongoDB
4. **Analytics Dashboard**: `/analytics` route displays comprehensive metrics with interactive charts:
   - Total clicks (combined, generate, download)
   - Monthly trends (12-month line chart)
   - Font and size usage distribution (pie charts)

## 🚀 Key Features & Technical Highlights

### Frontend Architecture
- **Full-Stack TypeScript**: Type-safe code from frontend to backend
- **React Components**: Modular, reusable UI components with proper separation of concerns
- **Real-time Preview**: Instant updates as users customize designs
- **Responsive Design**: Mobile-first approach with optimized layouts
- **Custom Hooks**: `useAnalytics` for data fetching and state management
- **Accessibility**: WCAG 2.1 AA compliant with semantic HTML and ARIA attributes

### Backend Architecture
- **Serverless Azure Functions**: Scalable, cost-efficient image generation
- **Node.js Canvas**: High-quality PNG rendering
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

```
cover-craft/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/             # Next.js app router pages
│   │   ├── components/      # React components (form, layout, UI, preview)
│   │   ├── hooks/           # Custom React hooks (e.g., analytics fetching)
│   │   └── lib/             # Utilities and API functions
│   └── package.json
├── api/                      # Azure Functions backend
│   ├── src/
│   │   ├── functions/       # Azure Function endpoints
│   │   └── assets/          # Fonts for image generation
│   └── package.json
├── docs/                     # Architecture and development docs
└── README.md                # This file
```

## 📊 Analytics Dashboard

The `/analytics` page provides real-time insights into user engagement:

| Chart | Purpose |
|-------|---------|
| **Total Clicks** | Bar chart showing combined, generate, and download totals |
| **Monthly Trends** | 12-month line chart tracking generate/download activity |
| **Font Usage** | Pie chart of font popularity |
| **Size Usage** | Pie chart of size preset preferences |

All data is persisted in MongoDB and aggregated on-demand. Built with recharts for interactive, responsive visualizations.

## 🏃 Getting Started

### Prerequisites
- Node.js 18+
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
