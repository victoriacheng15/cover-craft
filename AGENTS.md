# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Project Overview

Cover Craft is a serverless cover image generator. It consists of two main components:

1. **Next.js Frontend**: A standalone React application (located in `frontend/`) providing interactive controls and a Backend-for-Frontend (BFF) proxy.
2. **Go Azure Functions Backend**: A serverless API (located in `apiv2/`) running as a Go Custom Handler to render 2D graphics and process queue-backed generation jobs.

## Development Commands

### Environment Setup

```bash
make install-ui
```

### Local Run

```bash
# Start frontend locally (port 3000)
make run-ui

# Start Go API, Azurite emulator, and local Functions host (port 7071)
make run-go
```

### Local Dev Container

```bash
make dev-build    # Build development container image
make dev-run      # Start development container in background
make dev-stop     # Stop running container
make dev-logs     # Tail container logs
```

### Quality Checks

```bash
make lint-ui      # Audit frontend using Biome
make format-ui    # Format frontend using Biome
```

### Code Generation

```bash
make contract-sync  # Re-generate Go structs and TypeScript interfaces from openapi.yaml
```

### Testing

```bash
make test-all-go  # Run Go unit and BDD tests
make test-ui      # Run frontend component and hook tests
make cov-go       # Run Go coverage analysis (requires MONGODB_URI)
```

## Architecture

### API Contracts

- The API is contract-first with `openapi.yaml` as the single source of truth.
- Types in `frontend/src/types/api.ts` and structs in `apiv2/internal/types/` are generated automatically. Do not edit them manually.

### Graphics Rendering

- Image generation uses the pure-Go 2D graphics library `github.com/fogleman/gg`.
- Do not introduce C++ native dependencies (like Cairo or node-canvas) which break the serverless deployment and dev containers.

### Key Directories

- `frontend/`: Standalone Next.js App Router application.
- `apiv2/`: Standalone Go serverless Custom Handler application.
- `tofu/`: OpenTofu (Terraform-compatible) infrastructure configuration.
- `docs/`: System design docs, architectural decisions (ADRs), and incidents.

## Development Workflow

1. **Before Making Changes**: Ensure dependencies are installed and test runs pass.
2. **When API Changes occur**: Update `openapi.yaml` first, then run `make contract-sync` to propagate types.

## Common Pitfalls

1. **Loopback Bindings**: Do not bind services inside containers to `127.0.0.1` or `localhost` as they block port forwarding. Use wildcard `0.0.0.0` instead.
2. **Pie Chart Cells**: Do not use deprecated Recharts `<Cell>` components. Map sector colors directly using the dataset `fill` property.
3. **Secrets Management**: Keep credentials out of the codebase. Use `frontend/.env` and `apiv2/local.settings.json` locally.
