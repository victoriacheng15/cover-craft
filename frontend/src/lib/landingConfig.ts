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
			"React, Next.js (App Router), TypeScript, Azure Functions (Go Custom Handler), Azure Queue Storage, MongoDB, Terraform, Biome, Vitest",
		pattern:
			"Full-Stack Serverless Monorepo with BFF (Backend-for-Frontend) Proxying",
		entry_point:
			"frontend/src/app/page.tsx (client views), apiv2/ (Go Azure Functions handlers)",
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
│   Go Function    │    │   Go Function    │    │   Go Function    │
│  (SingleRender)  │    │ (QueueProducer)  │    │  (GetJobStatus)  │
└──────────────────┘    └──────────────────┘    └──────────────────┘
         │                       │                       │
         │ Uses                  │ Enqueues              │ Reads
         ▼                       ▼                       │ Status
┌──────────────────┐    ┌──────────────────┐             │
│  Go 2D Graphics  │    │   Azure Queue    │             │
└──────────────────┘    │     Storage      │             │
         ▲              └──────────────────┘             │
         │                       │                       │
         │ Uses                  │ Triggers              │
         │                       ▼                       │
         │              ┌──────────────────┐             │
         │              │   Go Function    │             │
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
                                 │ 2. Sets up Terraform (v1.6.0)
                                 │ 3. Runs 'terraform init & apply'
                                 │ 4. Deploys apps via Actions
      ┌────────────────────┐     │
      │ Azure Blob Storage │ <-> │
      │     (tfstate)      │     │
      └────────────────────┘     ▼
┌──────────────────────────────────────────────────────────────────┐
│                 Terraform Infrastructure Apply                   │
│    (Provision storage, App Insights, Function App, App Service)  │
└──────────────────────────────────────────────────────────────────┘
               │                                   │
               │ Build & Package                   │ Build & Package
               ▼                                   ▼
┌──────────────────────────────┐    ┌──────────────────────────────┐
│       apiv2-deploy.zip       │    │     frontend-deploy.zip      │
│         (Go Binary)          │    │ (Next.js Standalone build)   │
└──────────────────────────────┘    └──────────────────────────────┘
               │                                   │
               │ Zip Deploy                        │ Zip Deploy
               │ (functions-action)                │ (webapps-deploy)
               ▼                                   ▼
┌──────────────────────────────┐    ┌──────────────────────────────┐
│       Go Function App        │    │     Azure App Service UI     │
└──────────────────────────────┘    └──────────────────────────────┘`,
	},
	tech: [
		{
			title: "Go 2D Graphics Library",
			description:
				"Go 2D graphics library running inside a Go Custom Handler Function App to draw typography, colors, and layout styles into consistent PNG images without C++ runtime dependencies.",
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
				terminal_output: `> frontend@0.1.0 test
> vitest run

 RUN  v4.1.10 /frontend

 ✓ src/lib/download.test.ts (4 tests)
 ✓ src/components/ui/Cards.test.tsx (15 tests)
 ✓ src/hooks/useBatchForm.test.ts (9 tests)
 ✓ src/hooks/useForm.test.ts (29 tests)
 ✓ src/components/form/FormField.test.tsx (5 tests)
 ✓ src/components/ui/SectionTitle.test.tsx (12 tests)
 ✓ src/components/display/BatchResultsDisplay.test.tsx (6 tests)
 ...

 Test Files  14 passed (14)
      Tests  98 passed (98)
   Duration  1.82s`,
			},
			{
				title: "Go API Statement Coverage",
				terminal_output: `cd apiv2 && go test -coverprofile=coverage.out ./internal/... && go tool cover -func=coverage.out
ok  	github.com/victoriacheng15/cover-craft/apiv2/internal/db	coverage: 70.0% of statements
ok  	github.com/victoriacheng15/cover-craft/apiv2/internal/handlers	coverage: 83.4% of statements
ok  	github.com/victoriacheng15/cover-craft/apiv2/internal/queue	coverage: 32.1% of statements
ok  	github.com/victoriacheng15/cover-craft/apiv2/internal/services	coverage: 89.7% of statements
total:											(statements)			82.6%`,
			},
			{
				title: "Terraform Managed Infrastructure (State List)",
				terminal_output: `data.azurerm_resource_group.main
azurerm_resource_group.api
module.app_service.azurerm_linux_web_app.frontend
module.app_service.azurerm_service_plan.plan
module.application_insights.azurerm_application_insights.app_insights
module.application_insights.azurerm_log_analytics_workspace.workspace
module.function_app.data.azurerm_function_app_host_keys.api
module.function_app.data.azurerm_function_app_host_keys.go_api
module.function_app.azurerm_function_app_flex_consumption.api
module.function_app.azurerm_linux_function_app.go_api
module.function_app.azurerm_service_plan.flex_plan
module.function_app.azurerm_service_plan.go_plan
module.function_app.azurerm_storage_container.deploy
module.storage.azurerm_storage_account.storage`,
			},
		],
	},
	footer: {
		author: "Victoria Cheng",
		github_link: "https://github.com/victoriacheng15/cover-craft",
		linkedin_link: "https://www.linkedin.com/in/victoriacheng15",
	},
};
