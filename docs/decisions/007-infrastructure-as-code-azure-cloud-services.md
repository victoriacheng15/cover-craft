# ADR 007: Infrastructure as Code for Azure Cloud Services

- **Status:** Accepted
- **Date:** 2026-04-08
- **Author:** Victoria Cheng

## Context and Problem Statement

Cover Craft originally relied on a mix of manually managed Azure resources and deployment workflow configuration. That approach made the cloud environment harder to reproduce, review, and evolve as the system grew from a frontend/API demo into a production-style platform with Azure Functions, Azure Web App hosting, storage, Application Insights, and environment-specific secrets.

The project needed a repeatable way to provision and update cloud services without depending on portal-only changes or undocumented setup steps. The deployment pipeline also needed a clear boundary between infrastructure provisioning and application package deployment.

## Decision Outcome

The repository was migrated to **Infrastructure as Code (IaC)** using OpenTofu and the AzureRM provider. Azure cloud services are now defined in the `tofu/` directory and applied through the infrastructure deployment workflow before application code is deployed.

The IaC model manages:

- **Resource Groups:** Existing frontend resource group lookup plus a dedicated API resource group for Flex Consumption compatibility.
- **Storage:** Azure Storage Account resources used by the Function App deployment model.
- **Application Insights:** Shared observability configuration for the API runtime.
- **Frontend Hosting:** Linux Azure Web App and App Service Plan for the Next.js standalone frontend.
- **API Hosting:** Azure Functions Flex Consumption plan and Node.js 22 Function App.
- **Configuration:** Runtime app settings for MongoDB, Application Insights, and frontend-to-API routing.
- **Tagging:** Project-level tags applied consistently across managed resources.

The GitHub Actions deployment flow now applies infrastructure first, then deploys the API and frontend packages to the provisioned Azure services.

## Consequences

### Positive

- **Reproducible Cloud Environment:** Azure services are declared in version-controlled OpenTofu modules instead of relying on manual portal configuration.
- **Reviewable Infrastructure Changes:** Cloud changes can be reviewed through pull requests alongside application code.
- **Deployment Order Clarity:** The pipeline explicitly applies infrastructure before deploying Azure Functions and the Web App packages.
- **Lower Configuration Drift:** Resource names, SKUs, runtime versions, app settings, and tags are centralized in code.
- **Production Readiness:** The project now demonstrates a complete application lifecycle: provision, build, package, deploy, and observe.

### Negative

- **Higher Operational Complexity:** Contributors must understand OpenTofu state, AzureRM provider behavior, and CI authentication in addition to application code.
- **State Management Risk:** Remote state becomes a critical dependency for infrastructure changes and must be protected.
- **Migration Friction:** Azure hosting models have provider-specific constraints, such as Flex Consumption app setting compatibility and package deployment behavior.

## Verification

- [x] **Manual Check:** Confirmed `tofu/` modules define the Azure Web App, Azure Functions API, storage, and Application Insights resources.
- [x] **Manual Check:** Confirmed `infra-deploy.yml` applies OpenTofu before API and frontend deployment jobs.
- [x] **Operational Check:** Follow-up fixes documented Flex Consumption and OpenTofu deployment constraints in RCA records.
- [x] **Automated Tests:** Add CI validation for OpenTofu formatting and planning before deployment.
