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
			"Generate clean, readable cover images, multi-slide carousels, and animated GIF slideshows via interactive controls and asynchronous queued processing without manual design-tool setup.",
		stack:
			"React, Next.js (App Router), TypeScript, Azure Functions (Go Custom Handler), Azure Queue Storage, MongoDB, Terraform, Biome, Vitest",
		pattern:
			"Full-Stack Serverless Monorepo with BFF (Backend-for-Frontend) Proxying",
		entry_point:
			"frontend/src/app/page.tsx (client views), apiv2/ (Go Azure Functions handlers)",
		persistence_strategy:
			"MongoDB for job state and telemetry persistence, Azure Queue Storage for queue-based task management",
		observability:
			"Structured JSON logger, custom metrics, and telemetry dashboarding",
	},
	architecture: {
		diagram_ascii: `┌──────────────────────────────────────────────────────────────────┐
│                        Next.js Client UI                         │
└──────────────────────────────────────────────────────────────────┘
                                 │
                                 │ POST /api/generateImage (Cover)
                                 │ POST /api/generateCarousel (Carousel)
                                 │ POST /api/generateGif (Slideshow)
                                 │ GET /api/jobStatus (Poll Status)
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                        Next.js BFF Server                        │
└──────────────────────────────────────────────────────────────────┘
         │                       │                       │
         │ /generateImage,       │ /generateCarousel     │ /getJobStatus
         │ /generateGif          │                       │
         ▼                       ▼                       ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│    Image/GIF     │    │Carousel Generator│    │    Job Status    │
│    Generator     │    │  (Asynchronous)  │    │ (Polling Check)  │
└──────────────────┘    └──────────────────┘    └──────────────────┘
         │                       │                       │
         │                       │ Enqueues              │ Reads
         │ Uses                  ▼                       │ Status
         ▼              ┌──────────────────┐             │
┌──────────────────┐    │   Azure Queue    │             │
│   2D Graphics    │    │     Storage      │             │
│   & GIF Engine   │    └──────────────────┘             │
└──────────────────┘             │                       │
                                 │ Triggers              │
                                 ▼                       │
                        ┌──────────────────┐             │
                        │   Go Function    │             │
                        │  (QueueWorker)   │             │
                        └──────────────────┘             │
                                 │                       │
                                 │ Uses                  │
                                 ▼                       │
                        ┌──────────────────┐             │
                        │    PNG & PDF     │             │
                        │     Compiler     │             │
                        └──────────────────┘             │
                                 │                       │
                                 │ Updates               │
                                 ▼                       ▼
                        ┌──────────────────────────────────┐
                        │             MongoDB              │
                        │    (Job Status & Telemetry)      │
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
			title: "Queue-backed Carousel & PDF Processor",
			description:
				"Asynchronous queue-backed generation pipeline using gofpdf to compile multi-slide carousels into high-resolution multi-page PDF documents, coordinated via Azure Queue Storage and tracked in MongoDB.",
		},
		{
			title: "Animated GIF Engine",
			description:
				"Multi-frame GIF generation engine using Go standard library image/gif and palette quantization to assemble accessible animated cover slideshows without external C++ or FFmpeg dependencies.",
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
				"Supports rendering custom text and layout templates for single PNG cover outputs up to 1200x630, multi-slide carousels with 2 to 10 slides compiled into multi-page PDF documents via queue-backed background processing, and animated GIF slideshows with 2 to 10 slides and configurable frame delays (1000ms to 3000ms).",
		},
		verifiable_outputs: [
			{
				title: "Client UI Testing Runs",
				terminal_output: `> frontend@0.1.0 test
> vitest run

 RUN  v5.0.0 /frontend

 ✓ src/lib/utils.test.ts (7 tests)
 ✓ src/services/api.test.ts (32 tests)
 ✓ src/app/api/_utils/index.test.ts (16 tests)
 ✓ src/hooks/useCarouselForm.test.ts (11 tests)
 ✓ src/hooks/useGifForm.test.ts (11 tests)
 ✓ src/hooks/useForm.test.ts (31 tests)
 ✓ src/components/GenerationNav.test.tsx (2 tests)
 ✓ src/components/form/CarouselPreviewDisplay.test.tsx (2 tests)
 ✓ src/components/form/GifPreviewDisplay.test.tsx (2 tests)
 ✓ src/components/form/GifSettingsControls.test.tsx (1 test)
 ✓ src/components/ui.test.tsx (37 tests)
 ✓ src/hooks/useAnalytics.test.ts (13 tests)
 ...

 Test Files  16 passed (16)
      Tests  218 passed (218)
   Duration  2.10s`,
			},
			{
				title: "Go API Statement Coverage",
				terminal_output: `cd apiv2 && go test -coverprofile=coverage.out ./internal/... && go tool cover -func=coverage.out
ok  	github.com/victoriacheng15/cover-craft/apiv2/internal/db	coverage: 65.0% of statements
ok  	github.com/victoriacheng15/cover-craft/apiv2/internal/handlers	coverage: 73.1% of statements
ok  	github.com/victoriacheng15/cover-craft/apiv2/internal/middleware	coverage: 78.3% of statements
ok  	github.com/victoriacheng15/cover-craft/apiv2/internal/queue	coverage: 32.1% of statements
ok  	github.com/victoriacheng15/cover-craft/apiv2/internal/services	coverage: 83.0% of statements
total:											(statements)			74.3%`,
			},
			{
				title: "Go BDD End-to-End Scenarios",
				terminal_output: `make test-bdd
cd apiv2 && go test -v ./e2e/... && cd ..

Feature: Cover Craft REST API
  Scenario: Generate image with inset border enabled             # features/generate.feature:12
    When I send a "POST" request to "/api/generateImage" with body
    Then the response status code should be 200

Feature: Carousel Generation API
  Scenario: Submit carousel generation request                  # features/carousel.feature:30
    When I send a "POST" request to "/api/generateCarousel" with body
    Then the response status code should be 202

Feature: Animated GIF Generation API
  Scenario: Generate animated GIF with valid parameters          # features/gif.feature:6
    When I send a "POST" request to "/api/generateGif" with body
    Then the response status code should be 200
    And the response content type should be "image/gif"
  ...

25 scenarios (25 passed)
97 steps (97 passed)
PASS
ok  	github.com/victoriacheng15/cover-craft/apiv2/e2e	0.51s`,
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
