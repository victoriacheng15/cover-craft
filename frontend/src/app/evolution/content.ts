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
			"Migrated from local Python scripts to a cloud-native application. Established a design-first foundation and moved image generation behind a stateless serverless backend to reduce local setup friction and operational overhead.",
		timeline: [
			{
				date: "2025-04-05",
				title: "The Beginning: Local Automation",
				description:
					"Built a Python-driven automation tool to reduce repetitive cover image setup work. The dependency on local virtual environments exposed the need for a browser-based workflow that could run without project-specific machine setup.",
			},
			{
				date: "2025-08-01",
				title: "Design-First Architecture",
				description:
					"Adopted a design-first methodology for API contracts, data models, and privacy constraints. This reduced mid-implementation churn and made later frontend/backend integration easier to reason about.",
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
			"Established the Next.js frontend, CI/CD automation, and a privacy-first analytics path. Shared validation and accessibility checks became part of the product workflow instead of after-the-fact review.",
		timeline: [
			{
				date: "2025-10-27",
				title: "Frontend Architecture & Delivery",
				description:
					"Built the client application with Next.js App Router and introduced GitHub Actions checks to keep linting, tests, and deployment steps repeatable.",
			},
			{
				date: "2025-11-07",
				title: "Analytics & Compliance",
				description:
					"Added privacy-first telemetry backed by MongoDB and surfaced accessibility signals in the user workflow. Vitest coverage grew around validation, analytics transformation, and UI behavior.",
			},
			{
				date: "2025-12-13",
				title: "Full-Stack Optimization",
				description:
					"Moved shared validation and data contracts into a common package so the frontend and API could enforce the same rules. Expanded the analytics dashboard with Recharts to visualize usage and accessibility trends.",
				adrPath: "003-in-app-analytics-strategy",
			},
		],
	},
	{
		title: "Launch & Operations",
		intro:
			"Hardened the platform through structured observability, standardized error handling, and a full-stack monorepo. Deployment packaging became explicit so the API could run independently of local workspace assumptions.",
		timeline: [
			{
				date: "2026-01-01",
				title: "Landing and Evolution Pages Launch",
				description:
					"Launched the public landing page and evolution timeline to document how Cover Craft grew from automation script to production-style application.",
			},
			{
				date: "2026-01-07",
				title: "Operational Excellence",
				description:
					"Introduced structured JSON logging, correlation IDs, and consistent API error responses so operational behavior could be debugged from records instead of guesswork.",
			},
			{
				date: "2026-01-23",
				title: "Full-Stack Monorepo Orchestration",
				description:
					"Unified the frontend, API, and shared package into an npm workspace monorepo. This made cross-stack changes atomic and kept validation logic, types, and tests aligned.",
				adrPath: "004-full-stack-monorepo-orchestration",
			},
			{
				date: "2026-01-24",
				title: "Deployment Hardening & Artifact Audit",
				description:
					"Audited Azure Functions deployment artifacts after production links failed, then hardened CI packaging around the runtime layout Azure expects.",
				lessonLearned:
					"Workspace resolution is not the same as deployment packaging. The fix made the API artifact self-contained by installing production dependencies locally and copying the shared package build output into the deployed bundle.",
			},
		],
	},
	{
		title: "Design Automation & Color",
		intro:
			"Added design automation that balances creative variety with accessibility. Color randomization now generates readable starting points while preserving manual control.",
		timeline: [
			{
				date: "2026-01-27",
				title: "ADR 005: Algorithmic Color Randomization",
				description:
					"Documented a randomization system for background and text colors. The decision embedded WCAG contrast checks directly into selection logic so generated pairings start from an accessible baseline.",
				adrPath: "005-randomize-colors-feature",
			},
			{
				date: "2026-01-29",
				title: "Accessibility by Design: Color Automation",
				description:
					"Implemented and validated the color randomization algorithm. The implementation targets a 6.0:1 contrast ratio, exceeding the WCAG AA text threshold while keeping generated designs readable.",
				lessonLearned:
					"Benchmarking showed that a bounded validation loop is fast enough for interaction-scale use, with 6.0:1 pair generation averaging roughly 0.03ms in the documented test run.",
			},
		],
	},
	{
		title: "UX Refinement - Skeleton Loaders",
		intro:
			"Improved perceived performance by standardizing skeleton loading states across data-heavy views.",
		timeline: [
			{
				date: "2026-02-08",
				title: "Skeleton Loaders Implementation",
				description:
					"Implemented skeleton loaders for analytics surfaces to reserve layout space during asynchronous data fetching and reduce visual jumps.",
			},
		],
	},
	{
		title: "Scale & Asynchronous Architecture",
		intro:
			"Moved batch generation into a decoupled, event-driven pipeline with Azure Queue Storage and MongoDB-backed job state. The UI can submit work, poll progress, and remain responsive while the worker processes images.",
		timeline: [
			{
				date: "2026-02-26",
				title: "ADR 006: Asynchronous Job Queue Architecture",
				description:
					"Documented the transition from synchronous HTTP batch processing to an asynchronous job model. The accepted design uses MongoDB for job state, HTTP 202 responses for submission, and Azure Queue Storage for background processing.",
				adrPath: "006-batch-image-generation-architecture",
			},
			{
				date: "2026-02-28",
				title: "Asynchronous Bulk Generation",
				description:
					"Implemented queued bulk generation with pre-flight validation, job status polling, and fault isolation through settled per-image processing. This keeps long-running work out of the request/response path.",
				adrPath: "006-batch-image-generation-architecture",
			},
		],
	},
	{
		title: "Infrastructure, Reliability & Documentation",
		intro:
			"Codified the Azure platform with OpenTofu, documented operational lessons as RCAs, and strengthened batch reliability with retry-aware processing.",
		timeline: [
			{
				date: "2026-04-08",
				title: "ADR 007: Infrastructure as Code for Azure Cloud Services",
				description:
					"Migrated Azure resource management into OpenTofu modules for Azure Functions, Azure Web App hosting, storage, Application Insights, and runtime configuration.",
				adrPath: "007-infrastructure-as-code-azure-cloud-services",
			},
			{
				date: "2026-04-08",
				title: "Flex Consumption Deployment Hardening",
				description:
					"Resolved deployment configuration gaps from the Azure Functions Flex Consumption migration, including CI authentication for OpenTofu, package-based API execution, and removal of unsupported runtime settings.",
				lessonLearned:
					"Hosting-plan migrations need configuration review, not just resource translation. Settings that worked in one Azure Functions model can be invalid in another.",
			},
			{
				date: "2026-04-11",
				title: "Architecture and Incident Documentation",
				description:
					"Added architecture, operations, decision, and incident documentation so production lessons are visible alongside implementation details.",
				lessonLearned:
					"RCAs turn one-off fixes into reusable engineering knowledge by capturing impact, root cause, resolution, and prevention steps.",
			},
			{
				date: "2026-04-21",
				title: "Retry-Aware Batch Processing",
				description:
					"Strengthened batch job resilience with atomic worker claiming, stale-job recovery, bounded job attempts, and per-image retries for transient rendering failures.",
				lessonLearned:
					"Queue-based systems need explicit retry and recovery semantics. Without bounded attempts and stale lock handling, transient failures can become stuck jobs or duplicate work.",
			},
		],
	},
];
