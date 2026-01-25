export interface TimelineEvent {
	date: string;
	title: string;
	description: string;
	lessonLearned?: string;
	adrPath?: string;
}

export interface Chapter {
	title: string;
	period: string;
	intro: string;
	timeline: TimelineEvent[];
}

export const chapters: Chapter[] = [
	{
		title: "Inception & Architecture",
		period: "Apr 05, 2025 - Sep 23, 2025",
		intro:
			"Transitioning from local scripting to a disciplined cloud-native approach. Established a 'Design-First' foundation and migrated core logic to a stateless serverless architecture.",
		timeline: [
			{
				date: "2025-04-05",
				title: "The Beginning: Local Automation",
				description:
					"Developed a Python CLI tool to automate LinkedIn cover generation. While functional, the dependency on local virtual environments highlighted the need for a cloud-native, zero-setup solution.",
			},
			{
				date: "2025-08-01",
				title: "Design-First Architecture",
				description:
					"Adoption of a 'Design-First' methodology. Defined core system architecture, data privacy constraints, and API contracts before implementation, ensuring a scalable and maintainable foundation.",
				adrPath: "001-design-first-methodology",
			},
			{
				date: "2025-09-23",
				title: "Serverless Backend",
				description:
					"Engineered a serverless architecture using Azure Functions and TypeScript. Focused on stateless image generation to ensure high availability and minimize operational costs.",
				adrPath: "002-serverless-backend-architecture",
			},
		],
	},
	{
		title: "Foundation & Delivery",
		period: "Oct 27, 2025 - Dec 13, 2025",
		intro:
			"Shifted focus to UX and rigorous delivery. Defined Next.js frontend architecture, implemented privacy-compliant analytics, and enforced quality via automated CI/CD and testing.",
		timeline: [
			{
				date: "2025-10-27",
				title: "Frontend Architecture & Delivery",
				description:
					"Architected the client-side using Next.js for performance and SEO. Established a rigid CI/CD pipeline with GitHub Actions to enforce code quality and automate deployment.",
			},
			{
				date: "2025-11-07",
				title: "Analytics & Compliance",
				description:
					"Designed a privacy-first telemetry system using MongoDB to track user engagement and compliance. Implemented comprehensive testing strategies with Vitest and real-time WCAG checks.",
			},
			{
				date: "2025-12-13",
				title: "Full-Stack Optimization",
				description:
					"Refactored codebase to share validation logic between frontend and backend, ensuring consistency and eliminating duplication bugs. Enhanced the Analytics Dashboard with Recharts for visualizing system performance and user engagement.",
				adrPath: "003-in-app-analytics-strategy",
			},
		],
	},
	{
		title: "Launch & Operations",
		period: "Jan 01, 2026 - Present",
		intro:
			"Hardening for production. Launched publicly, enhanced observability with structured logging, and evolved towards a monorepo for long-term maintainability and velocity.",
		timeline: [
			{
				date: "2026-01-01",
				title: "Landing and Evolution Pages Launch",
				description:
					"Launched the public landing page and this evolution timeline to transparently share Cover Craft’s journey.",
			},
			{
				date: "2026-01-07",
				title: "Operational Excellence",
				description:
					"Transitioned to structured JSON logging with correlation IDs and a centralized MongoDB sink. Standardized error handling across the serverless architecture to ensure production-grade maintainability.",
			},
			{
				date: "2026-01-23",
				title: "Full-Stack Monorepo Orchestration",
				description:
					"Unified the entire platform into a cohesive full-stack workspace to improve engineering velocity and system consistency. This structural upgrade ensures all components stay in sync, significantly reducing maintenance overhead while providing a more robust foundation for future growth.",
				adrPath: "004-full-stack-monorepo-orchestration",
			},
			{
				date: "2026-01-24",
				title: "Deployment Hardening & Artifact Audit",
				description:
					"Investigated and resolved 404 errors encountered on deployed links by auditing the full deployment lifecycle.",
				lessonLearned:
					"Debugged 404 errors by comparing GitHub and Azure Blob Storage artifacts. This process of elimination revealed that npm workspace symlinking excluded native dependencies (canvas, mongodb) from the function package. Resolved this by hardening the CI/CD workflow to ensure a self-contained, workspace-aware bundle, ensuring deployment integrity.",
			},
		],
	},
];