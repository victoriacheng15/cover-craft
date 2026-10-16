# ==============================================================================
# Help
# ==============================================================================

.DEFAULT_GOAL := help

.PHONY: help

help: ## Show this help message
	@awk 'BEGIN {FS = ":.*##"; printf "\n\033[1mUsage:\033[0m\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1;33m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

# ==============================================================================
# Workflows
# ==============================================================================
##@ Workflows

.PHONY: test lint format

test: test-backend test-frontend ## Run all tests across the entire stack (backend and frontend)

lint: lint-go lint-ui lint-md ## Run all static analysis checks (Go vet, Biome, markdownlint)

format: format-go format-ui format-md ## Automatically format Go, frontend, and markdown files

# ==============================================================================
# Code Generation & Contracts
# ==============================================================================
##@ Code Generation & Contracts

.PHONY: contract-sync

contract-sync: ## Synchronize API contracts and regenerate Go/TS types
	./scripts/sync-contracts.sh

# ==============================================================================
# Markdown
# ==============================================================================
##@ Markdown

.PHONY: lint-md format-md

lint-md: ## Run markdown linter checks
	npx markdownlint-cli "**/*.md" --ignore "**/node_modules/**"

format-md: ## Automatically fix markdown formatting issues
	npx markdownlint-cli "**/*.md" --fix --ignore "**/node_modules/**"

# ==============================================================================
# Go API
# ==============================================================================
##@ Go API

.PHONY: update-go format-go lint-go test-go test-bdd test-backend cov-go build-go

update-go: ## Update Go dependencies and tidy go.mod
	cd apiv2 && go get -u ./... && go mod tidy && cd ..

format-go: ## Format Go source files
	cd apiv2 && go fmt ./cmd/... ./internal/... ./e2e/... && cd ..

lint-go: ## Run static analysis checks on Go API (go vet)
	cd apiv2 && go vet ./cmd/... ./internal/... ./e2e/... && cd ..

test-go: ## Run Go unit tests
	cd apiv2 && go test ./internal/... && cd ..

test-bdd: ## Run Go BDD end-to-end features
	cd apiv2 && go test -v ./e2e/... && cd ..

test-backend: test-go test-bdd ## Run all Go unit and BDD tests

cov-go: ## Run Go unit tests and print terminal coverage summary
	cd apiv2 && go test -coverprofile=coverage.out ./internal/... && go tool cover -func=coverage.out && rm coverage.out && cd ..

build-go: ## Compile the Go application binary
	cd apiv2 && mkdir -p bin && CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o bin/apiv2-handler cmd/handler/main.go && cd ..

# ==============================================================================
# Frontend
# ==============================================================================
##@ Frontend

.PHONY: install-ui build-ui test-frontend lint-ui format-ui

install-ui: ## Install frontend dependencies
	cd frontend && npm install && cd ..

build-ui: ## Build the Next.js production bundle
	cd frontend && npm run build && cd ..

test-frontend: ## Run frontend Vitest tests
	cd frontend && npm run test && cd ..

lint-ui: ## Run linter checks for frontend code using Biome
	cd frontend && npm run lint && cd ..

format-ui: ## Format frontend source files using Biome
	cd frontend && npm run format && cd ..

# ==============================================================================
# Local Dev Env
# ==============================================================================
##@ Local Dev Env

DEV_IMAGE := cover-craft-dev-v2:latest
DEV_CONTAINER := cover-craft-dev-v2

.PHONY: dev-build dev-run dev-stop dev-logs dev-shell dev-clean

dev-build: dev-stop ## Build the V2 dev container image using Podman
	podman build -t $(DEV_IMAGE) -f Dockerfile.v2 .

dev-run: ## Run the V2 dev container with volume mounts and port mappings
	podman rm -f $(DEV_CONTAINER) || true
	podman run -d --rm \
		-p 3000:3000 \
		-p 7071:7071 \
		-p 10000:10000 \
		-p 10001:10001 \
		-p 10002:10002 \
		-v .:/app:Z \
		--name $(DEV_CONTAINER) \
		$(DEV_IMAGE)

dev-stop: ## Stop the running V2 dev container
	podman stop $(DEV_CONTAINER) || true

dev-logs: dev-build dev-run ## Tail the logs of the running V2 container
	podman logs -f $(DEV_CONTAINER)

dev-shell: ## Open an interactive bash shell inside the running V2 container
	podman exec -it $(DEV_CONTAINER) /bin/bash

dev-clean: dev-stop ## Remove the V2 dev container image
	podman rmi $(DEV_IMAGE)
