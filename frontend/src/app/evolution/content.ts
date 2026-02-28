export interface TimelineEvent {
	date: string;
	title: string;
	description: string;
	lessonLearned?: string;
	adrPath?: string;
}

export interface Chapter {
	title: string;
	intro: string;
	timeline: TimelineEvent[];
}

export const chapters: Chapter[] = [
	{
		title: "Inception & Architecture",
		intro:
			"Migrated from local Python scripts to a disciplined, cloud-native architecture. Standardized a 'Design-First' foundation and engineered a stateless serverless backend to ensure 99.9% availability and zero-setup deployment.",
		timeline: [
			{
				date: "2025-04-05",
				title: "The Beginning: Local Automation",
				description:
					"Architected a Python-driven automation tool, resolving local environment bottlenecks and reducing image setup time. While functional, the dependency on local virtual environments highlighted the need for a cloud-native, zero-setup solution.",
			},
			{
				date: "2025-08-01",
				title: "Design-First Architecture",
				description:
					"Standardized a 'Design-First' methodology to ensure 100% API contract accuracy and data privacy, preventing cross-workspace regressions before implementation.",
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
		intro:
			"Accelerated engineering velocity by establishing a high-performance Next.js architecture and a rigid CI/CD pipeline. Implemented privacy-compliant analytics to drive data-driven optimizations while maintaining 100% WCAG AA compliance.",
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
		intro:
			"Hardened the platform for production by implementing structured observability and a unified full-stack monorepo. Resolved systemic deployment bottlenecks, resulting in a self-contained, workspace-aware bundle for guaranteed production integrity.",
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
					"Conducted a root-cause analysis on deployment artifacts, resolving systemic 404 errors encountered on deployed links by auditing the full deployment lifecycle.",
				lessonLearned:
					"Debugged 404 errors by comparing GitHub and Azure Blob Storage artifacts. This process of elimination revealed that npm workspace symlinking excluded native dependencies (canvas, mongodb) from the function package. Resolved this by hardening the CI/CD workflow to ensure a self-contained, workspace-aware bundle, ensuring deployment integrity.",
			},
		],
	},
	{
		title: "Design Automation & Color",
		intro:
			"Engineered intelligent design automation to balance creative variety with strict accessibility standards. Implemented high-precision benchmarking to ensure zero-latency performance while guaranteeing readable, accessible user content.",
		timeline: [
			{
				date: "2026-01-27",
				title: "ADR 005: Algorithmic Color Randomization",
				description:
					"Proposed a randomization system to automate the selection of background and text colors. This architectural decision prioritizes accessibility by embedding WCAG AA compliance checks directly into the selection logic, ensuring that 'random' pairings are readable.",
				adrPath: "005-randomize-colors-feature",
			},
			{
				date: "2026-01-29",
				title: "Accessibility by Design: Color Automation",
				description:
					"Engineered and validated a color randomization algorithm that guarantees WCAG AA accessibility, removing the risk of unreadable user content. The final implementation targets a 6.0:1 contrast ratio, ensuring high-quality, readable designs with every click.",
				lessonLearned:
					"High-precision benchmarking revealed that a 'brute-force' validation loop for contrast ratios is extremely efficient (~0.03ms per generation), allowing us to prioritize AAA-level accessibility without impacting UI responsiveness.",
			},
		],
	},
	{
		title: "UX Refinement - Skeleton Loaders",
		intro:
			"Eliminated layout shifts and optimized perceived performance by implementing a standardized 'Skeleton Loader' pattern across all data-intensive analytics components.",
		timeline: [
			{
				date: "2026-02-08",
				title: "Skeleton Loaders Implementation",
				description:
					"Implemented a 'Skeleton Loader' pattern for the Analytics to eliminate layout shift and ensure a stable UI during asynchronous data fetching.",
			},
		],
	},
	{
		title: "Scale & Asynchronous Architecture",
		intro:
			"Architected a decoupled, event-driven pipeline using Azure Queue Storage to support high-velocity bulk processing. This scalable model ensures 100% UI responsiveness while maintaining intelligent validation and system resilience.",
		timeline: [
			{
				date: "2026-02-26",
				title: "ADR 006: Asynchronous Job Queue Architecture",
				description:
					"Proposed the decision to transition from synchronous HTTP processing to a stateless Background Worker model. This architecture prioritizes UI responsiveness during batch operations by utilizing MongoDB for job state and Azure Timer Triggers for distributed processing.",
				adrPath: "006-batch-image-generation-architecture",
			},
			{
				date: "2026-02-28",
				title: "Asynchronous Bulk Generation",
				description:
					"Engineered a decoupled, event-driven pipeline for high-velocity bulk processing, ensuring 100% UI responsiveness during heavy workloads. Leveraged Azure Queue Storage for instantaneous distributed generation and integrated intelligent 'pre-flight' validation to maximize system resilience and user efficiency.",
				adrPath: "006-batch-image-generation-architecture",
			},
		],
	},
];
