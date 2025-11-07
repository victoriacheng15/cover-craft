# Cover Craft 🎨

A full-stack cover image generator application showcasing modern web development, cloud deployment, and best practices. Demonstrates end-to-end integration of responsive frontend, serverless backend, and cloud infrastructure for production-ready applications.

## 🧰 Tech Stack

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6.svg?style=for-the-badge&logo=TypeScript&logoColor=white) ![Next.js](https://img.shields.io/badge/Next.js-000000.svg?style=for-the-badge&logo=nextdotjs&logoColor=white) ![React](https://img.shields.io/badge/React-61DAFB.svg?style=for-the-badge&logo=React&logoColor=black) ![Tailwind%20CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4.svg?style=for-the-badge&logo=Tailwind-CSS&logoColor=white) ![Azure%20Functions](https://img.shields.io/badge/Azure%20Functions-0078D4.svg?style=for-the-badge&logo=Azure-Functions&logoColor=white) ![Vercel](https://img.shields.io/badge/Vercel-000000.svg?style=for-the-badge&logo=Vercel&logoColor=white) ![Vitest](https://img.shields.io/badge/Vitest-6E9F18.svg?style=for-the-badge&logo=Vitest&logoColor=white) ![Biome](https://img.shields.io/badge/Biome-60A5FA.svg?style=for-the-badge&logo=Biome&logoColor=white)

## 📘 Documentation & Notes

- [Frontend Architecture](./docs/frontend_architecture.md): Component structure, real-time preview, state management, and accessibility
- [Backend Architecture](./docs/backend_architecture.md): Serverless API design, image generation logic, and validation
- [DevOps Practices](./docs/devops_practice.md): Deployment strategies, CI/CD pipelines, and cloud infrastructure
- [Learning Notes](./docs/learning_note.md): Key takeaways from deploying to Azure Function App


## 🚀 Key Features & Technical Highlights

- **Full-Stack TypeScript**: Type-safe code from frontend to backend for improved reliability and developer experience
- **Real-time Preview**: React state management with instant UI updates as users customize cover designs
- **Serverless Backend**: Azure Functions with Node.js Canvas for scalable, cost-efficient image generation
- **Cloud Deployment**: Frontend on Vercel, backend on Azure Function App - demonstrating multi-cloud integration
- **Responsive Design**: Mobile-first approach with optimized layouts for all device sizes
- **Accessibility**: WCAG 2.1 AA compliant with semantic HTML and ARIA attributes
- **Modular Architecture**: Well-organized components and clear separation of concerns for maintainability
- **Comprehensive Testing**: Unit tests for both frontend and backend with Vitest
- **Code Quality**: Automated linting and formatting with Biome

## 🧠 Why This Project

This project demonstrates my ability to:

- **Design and build production-ready applications** with modern frontend frameworks and serverless backend architecture
- **Deploy to cloud platforms** (Vercel, Azure) with proper configuration and optimization
- **Implement best practices** including type safety, testing, accessibility, and code quality standards
- **Manage full-stack development** from UI/UX to API design and cloud infrastructure
- **Write scalable code** with modular components, proper error handling, and validation

### Technical Outcomes

- ✅ Full-stack TypeScript application with end-to-end type safety
- ✅ Serverless image generation API handling concurrent requests
- ✅ Multi-cloud deployment (Vercel for frontend, Azure for backend)
- ✅ Comprehensive test coverage for critical functionality
- ✅ WCAG 2.1 AA accessibility compliance
- ✅ Clean, maintainable codebase with clear documentation

## ⚙️ What It Does

- Provides a modern UI for creating custom cover images
- Generates high-quality PNG images on the backend
- Supports multiple size presets and font options
- Manages form state efficiently with React hooks
- Handles color customization and real-time preview rendering

## 📂 Project Structure

```
cover-craft/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/             # Next.js app router pages
│   │   ├── components/      # React components (form, layout, UI, preview)
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

## 🌍 Environment Overview

This project is designed to work across different environments:

### Frontend

| Environment | Description |
|-------------|-------------|
| **Local** | Run Next.js dev server on `http://localhost:3000`. Fastest for UI development. |
| **Production** | Deployed to [Vercel](https://vercel.com). |

### Backend

| Environment | Description |
|-------------|-------------|
| **Local** | Run Azure Functions locally on `http://localhost:7071`. Test image generation without cloud. |
| **Production** | Deployed to Azure Function App. |

## �🏃 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Azure Functions Core Tools (for local backend development)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/victoriacheng15/cover-craft.git
cd cover-craft
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Install backend dependencies:
```bash
cd ../api
npm install
```

### Running Locally

**Frontend:**
```bash
cd frontend
npm run dev
```
Visit `http://localhost:3000` in your browser.

**Backend (Azure Functions):**
```bash
cd api
npm run prestart
npm start
```
The API will be available at `http://localhost:7071`

## 🧪 Testing & Code Quality

**Frontend tests:**
```bash
cd frontend
npm run test
```

**Frontend linting:**
```bash
cd frontend
npm run lint
```

**Backend tests:**
```bash
cd api
npm run test
```

**Backend linting:**
```bash
cd api
npm run lint
```

## ♿ Accessibility

This project is built with accessibility in mind:
- Semantic HTML and ARIA attributes
- WCAG 2.1 AA color contrast ratios
- Screen reader announcements for dynamic content
- Visible focus indicators

See [Accessibility Standards](./docs/frontend_architecture.md#accessibility-standards) in the frontend architecture documentation for details.
