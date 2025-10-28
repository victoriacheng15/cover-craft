# DevOps Practices

This document outlines all DevOps workflows, CI/CD pipelines, and automation practices used in the Cover Craft project.

## Overview

The project uses GitHub Actions for continuous integration, deployment, and code quality checks. All workflows follow a snake_case naming convention and use path filters to optimize CI/CD execution.

## Workflow Architecture

### Path-Based Triggering

All workflows use path filters to ensure they only run when relevant files change:

- **API workflows**: Trigger on `api/**` changes
- **Frontend workflows**: Trigger on `frontend/**` changes
- **Documentation workflows**: Trigger on `**/*.md` changes

This approach:

- Reduces unnecessary workflow runs
- Saves CI/CD minutes
- Provides faster feedback
- Keeps concerns separated

## Active Workflows

### 1. API - Biome Format Check (`api_format.yml`)

**Purpose**: Ensures consistent code formatting in the API codebase using Biome.

**Trigger**: Pull requests that modify files in `api/**`

**Steps**:

1. Checkout code
2. Setup Node.js 22.x
3. Run Biome format check on API files

**Key Features**:

- Uses custom reusable action: `victoriacheng15hub/platform-actions/biome-format@main`
- Fails PR if formatting issues are detected
- Fast feedback loop for developers

---

### 2. API - PR Build & Test Check (`api_pr_check.yml`)

**Purpose**: Validates that API code builds successfully and all tests pass before merging.

**Trigger**: Pull requests to `main` branch that modify files in `api/**`

**Environment Variables**:

- `AZURE_FUNCTIONAPP_PACKAGE_PATH`: `api/`
- `NODE_VERSION`: `22.x`

**Steps**:

1. Checkout code
2. Setup Node.js 22.x
3. Install dependencies (`npm install`)
4. Build project (`npm run build`)
5. Run tests (`npm run test -- --run`)

**Key Features**:

- Prevents broken code from reaching main branch
- Ensures all tests pass (31 test cases for generateCoverImage)
- Validates TypeScript compilation
- Required check before merge

---

### 3. Function App Deployment (`azure_function.yml`)

**Purpose**: Automatically deploys the API to Azure Functions when changes are merged to main.

**Trigger**:

- Push to `main` branch with changes in `api/**`
- Manual dispatch (`workflow_dispatch`)

**Environment Variables**:

- `AZURE_FUNCTIONAPP_NAME`: `cover-craft`
- `AZURE_FUNCTIONAPP_PACKAGE_PATH`: `api/`
- `NODE_VERSION`: `22.x`

**Steps**:

1. Checkout code
2. Setup Node.js 22.x
3. Install dependencies and build (`npm install`, `npm run build`)
4. Run tests (`npm run test`)
5. Azure Login using stored credentials
6. Create deployment zip (excluding `local.settings.json`)
7. Deploy to Azure Functions using Azure CLI

**Key Features**:

- Automated deployment on merge to main
- Excludes sensitive configuration files from deployment
- Runs full test suite before deployment
- Uses Azure service principal credentials stored in GitHub secrets
- Zero-downtime deployment

**Required Secrets**:

- `AZURE_CREDENTIALS`: Azure service principal credentials

---

### 4. Frontend - Biome Format Check (`frontend_format.yml`)

**Purpose**: Ensures consistent code formatting in the frontend codebase using Biome.

**Trigger**: Pull requests that modify files in `frontend/**`

**Steps**:

1. Checkout code
2. Setup Node.js 22.x
3. Run Biome format check on frontend files

**Key Features**:

- Ready for when frontend is implemented
- Uses same format checking approach as API
- Uses custom reusable action: `victoriacheng15hub/platform-actions/biome-format@main`

**Status**: ⏳ Prepared but inactive until `frontend/` folder exists

---

### 5. Markdown Linter (`markdownlint.yml`)

**Purpose**: Ensures consistent markdown formatting across all documentation files.

**Trigger**:

- Pull requests to `main` branch that modify `**/*.md` files
- Manual dispatch (`workflow_dispatch`)

**Steps**:

1. Checkout code
2. Run markdown linter on all `.md` files

**Key Features**:

- Uses custom reusable action: `victoriacheng15hub/platform-actions/markdown-linter@main`
- Maintains documentation quality
- Enforces markdown best practices
