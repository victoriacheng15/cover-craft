export interface CoreComponent {
	title: string;
	description: string;
}

export interface ProofItem {
	title: string;
	description: string;
}

export interface Pivot {
	title: string;
	description: string;
}

export interface VerifiableOutput {
	title: string;
	terminal_output: string;
}

export interface LandingConfig {
	header: {
		project_name: string;
		site_url: string;
	};
	llms: {
		objective: string;
		stack: string;
		pattern: string;
		entry_point: string;
		persistence_strategy: string;
		observability: string;
	};
	architecture: {
		diagram_ascii: string;
		pipeline_diagram_ascii: string;
	};
	tech: CoreComponent[];
	proof: ProofItem[];
	reach: {
		humble_pivots: Pivot[];
		objective_clarity: {
			description: string;
		};
		verifiable_outputs: VerifiableOutput[];
	};
	footer: {
		author: string;
		github_link: string;
		linkedin_link: string;
	};
}

export const landingConfig: LandingConfig = {
	header: {
		project_name: "Cover Craft",
		site_url: "https://cover-craft-ui.azurewebsites.net/",
	},
	llms: {
		objective:
			"Generate clean, readable cover images via interactive controls and queued batch processing without manual design-tool setup.",
		stack:
			"React, Next.js (App Router), TypeScript, Azure Functions, Azure Queue Storage, MongoDB, OpenTofu, Biome, Vitest",
		pattern:
			"Full-Stack Serverless Monorepo with BFF (Backend-for-Frontend) Proxying",
		entry_point:
			"frontend/src/app/page.tsx (client views), api/ (Azure Functions handlers), shared/ (validation and common types)",
		persistence_strategy:
			"MongoDB for batch job state persistence, Azure Queue Storage for queue-based task management",
		observability:
			"Structured JSON logger, custom metrics, and telemetry dashboarding",
	},
	architecture: {
		diagram_ascii: `┌──────────────────────────────────────────────────────────────────┐
│                        Next.js Client UI                         │
└──────────────────────────────────────────────────────────────────┘
                                 │
                                 │ POST /api/generateImage (Single)
                                 │ POST /api/generateImages (Batch)
                                 │ GET /api/jobStatus (Poll Status)
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                        Next.js BFF Server                        │
└──────────────────────────────────────────────────────────────────┘
         │                       │                       │
         │ /generateImage        │ /generateImages       │ /getJobStatus
         ▼                       ▼                       ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Azure Function  │    │  Azure Function  │    │  Azure Function  │
│  (SingleRender)  │    │ (QueueProducer)  │    │  (GetJobStatus)  │
└──────────────────┘    └──────────────────┘    └──────────────────┘
         │                       │                       │
         │ Uses                  │ Enqueues              │ Reads
         ▼                       ▼                       │ Status
┌──────────────────┐    ┌──────────────────┐             │
│  Canvas Library  │    │   Azure Queue    │             │
└──────────────────┘    │     Storage      │             │
         ▲              └──────────────────┘             │
         │                       │                       │
         │ Uses                  │ Triggers              │
         │                       ▼                       │
         │              ┌──────────────────┐             │
         │              │  Azure Function  │             │
         │              │  (QueueWorker)   │             │
         │              └──────────────────┘             │
         │                       │                       │
         └───────────────────────┤                       │
                                 │ Updates               │
                                 ▼                       ▼
                        ┌──────────────────────────────────┐
                        │             MongoDB              │
                        │           (Job Status)           │
                        └──────────────────────────────────┘`,
		pipeline_diagram_ascii: `┌──────────────────────────────────────────────────────────────────┐
│                     Git Push / Merge to main                     │
└──────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                  GitHub Actions Runner (CI/CD)                   │
└──────────────────────────────────────────────────────────────────┘
                                 │
                                 │ 1. Azure Login (Service Principal)
                                 │ 2. Sets up OpenTofu (v1.6.0)
      ┌────────────────────┐     │ 3. Runs 'tofu init & apply'
      │ Azure Blob Storage │ <-> │
      │     (tfstate)      │     │
      └────────────────────┘     ▼
┌──────────────────────────────────────────────────────────────────┐
│                 OpenTofu Infrastructure Apply                    │
│    (Provision storage, App Insights, Function App, App Service)  │
└──────────────────────────────────────────────────────────────────┘
               │                                   │
               │ Build & Package                   │ Build & Package
               ▼                                   ▼
┌──────────────────────────────┐    ┌──────────────────────────────┐
│   Create api-deploy.zip      │    │ Create frontend-deploy.zip   │
│   (Bundles shared package)   │    │ (Next.js Standalone build)   │
└──────────────────────────────┘    └──────────────────────────────┘
               │                                   │
               │ Zip Deploy                        │ Zip Deploy
               │ (config-zip)                      │ (config-zip)
               ▼                                   ▼
┌──────────────────────────────┐    ┌──────────────────────────────┐
│        Azure Function        │    │     Azure App Service UI     │
│       ("cover-craft")        │    │      ("cover-craft-ui")      │
└──────────────────────────────┘    └──────────────────────────────┘`,
	},
	tech: [
		{
			title: "Canvas Rendering Engine",
			description:
				"Canvas rendering engine running inside Azure Functions to dynamically compile text, custom typography, and layout styles into consistent PNG images.",
		},
		{
			title: "Queue-backed Batch Processor",
			description:
				"Queue-backed batch processor with a retry-aware serverless worker that coordinates bulk generation requests asynchronously via Azure Queue Storage and tracks progress in MongoDB.",
		},
		{
			title: "Accessible Client Portal",
			description:
				"Accessible client portal with real-time WCAG AA contrast validation, color palette selection, and unified inputs shared programmatically with the validation engine.",
		},
	],
	proof: [
		{
			title: "Reproducibility",
			description:
				"Declarative infrastructure provisioning with OpenTofu (Terraform-compatible), remote state tracking in Azure Blob Storage, and automated GitHub Actions CI/CD workflows for consistent serverless deployment.",
		},
		{
			title: "Automated Verification",
			description:
				"Comprehensive Vitest test suite executing client component validation, shared rules, and API handlers under automated test runs.",
		},
		{
			title: "Telemetry Pipeline",
			description:
				"Structured application monitoring logs and MongoDB query tracking to observe backend execution bottlenecks and queue latencies.",
		},
	],
	reach: {
		humble_pivots: [
			{
				title: "Azure Functions Monorepo Packaging & Deployment",
				description:
					"Initially structured as individual nested packages, deployment frequently failed due to missing workspace dependencies. We pivoted to a centralized API packaging approach where CI explicitly builds @cover-craft/shared and copies production outputs directly into the serverless zip artifact.",
			},
			{
				title: "Batch API Authentication Boundary",
				description:
					"Securing the backend with Azure Function keys broke direct client requests. We refactored to a Backend-for-Frontend (BFF) proxy pattern in Next.js, securely injecting function keys server-side and shielding secrets from the client browser.",
			},
		],
		objective_clarity: {
			description:
				"Supports rendering custom text and layout templates for PNG outputs up to 1200x630. Batch jobs are limited to a maximum of 5 images per request to prevent API timeout constraints.",
		},
		verifiable_outputs: [
			{
				title: "Client UI Testing Runs",
				terminal_output: `> frontend@1.0.0 test
> vitest run

 RUN  v4.1.8 /frontend

 ✓ src/lib/download.test.ts (4 tests)
 ✓ src/components/ui/Cards.test.tsx (15 tests)
 ✓ src/hooks/useBatchForm.test.ts (9 tests)
 ✓ src/hooks/useForm.test.ts (29 tests)
 ✓ src/components/form/FormField.test.tsx (5 tests)
 ✓ src/components/ui/SectionTitle.test.tsx (12 tests)
 ✓ src/components/display/BatchResultsDisplay.test.tsx (6 tests)
 ✓ src/components/form/CoverForm.test.tsx (18 tests)
 ...

 Test Files  31 passed (31)
      Tests  192 passed (192)
   Duration  2.11s`,
			},
			{
				title: "Serverless Backend API Testing Runs",
				terminal_output: `> api@1.0.0 test
> vitest run

 RUN  v4.1.8 /api

 ✓ src/functions/analytics.test.ts (4 tests)
 ✓ src/functions/metrics.test.ts (7 tests)
 ✓ src/functions/getJobStatus.test.ts (7 tests)
 ✓ src/functions/healthCheck.test.ts (5 tests)
 ✓ src/functions/generateImages.test.ts (4 tests)
 ✓ src/lib/mongoose.test.ts (5 tests)
 ✓ src/functions/generateImage.test.ts (37 tests)
 ✓ src/functions/processJobs.test.ts (4 tests)

 Test Files  8 passed (8)
      Tests  73 passed (73)
   Duration  1.40s`,
			},
		],
	},
	footer: {
		author: "Victoria Cheng",
		github_link: "https://github.com/victoriacheng15/cover-craft",
		linkedin_link: "https://www.linkedin.com/in/victoriacheng15",
	},
};
