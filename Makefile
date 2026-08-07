# ==============================================================================
# Local Dev Env
# ==============================================================================

DEV_IMAGE := cover-craft-dev-v2:latest
DEV_CONTAINER := cover-craft-dev-v2

.PHONY: dev-build dev-run dev-stop dev-logs dev-shell dev-clean contract-sync

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

contract-sync: ## Synchronize API contracts and regenerate Go/TS types
	./scripts/sync-contracts.sh

# ==============================================================================
# Markdown
# ==============================================================================

.PHONY: lint-md format-md

lint-md: ## Run markdown linter checks
	npx markdownlint-cli "**/*.md" --ignore "**/node_modules/**"

format-md: ## Automatically fix markdown formatting issues
	npx markdownlint-cli "**/*.md" --fix --ignore "**/node_modules/**"

# ==============================================================================
# Go API (apiv2)
# ==============================================================================

.PHONY: update-go fmt-go lint-go test-go test-bdd test-all-go cov-go build-go run-go clean-go

update-go: ## Update Go dependencies and tidy go.mod
	cd apiv2 && go get -u ./... && go mod tidy && cd ..

fmt-go: ## Format Go source files
	cd apiv2 && go fmt ./cmd/... ./internal/... ./e2e/... && cd ..

lint-go: ## Run static analysis checks on Go API (go vet)
	cd apiv2 && go vet ./cmd/... ./internal/... ./e2e/... && cd ..

test-go: ## Run Go unit tests
	cd apiv2 && go test ./internal/... && cd ..

test-bdd: ## Run Go BDD end-to-end features
	cd apiv2 && go test -v ./e2e/... && cd ..

test-all-go: test-go test-bdd ## Run all Go unit and BDD tests

cov-go: ## Run Go unit tests and print terminal coverage summary
	cd apiv2 && go test -coverprofile=coverage.out ./internal/... && go tool cover -func=coverage.out && rm -f coverage.out && cd ..

build-go: ## Compile the Go application binary
	cd apiv2 && mkdir -p bin && CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o bin/apiv2-handler cmd/handler/main.go && cd ..

run-go: build-go ## Compile Go binary, start Azurite in background, and start Functions host
	mkdir -p __azurite_db__
	npx azurite --silent --location ./__azurite_db__ &
	cd apiv2 && func start && cd ..

clean-go: ## Remove Go build and coverage artifacts
	cd apiv2 && rm -rf bin/ coverage.out coverage_bdd.out && cd ..

# ==============================================================================
# Frontend
# ==============================================================================

.PHONY: install-ui build-ui run-ui test-ui lint-ui format-ui

install-ui: ## Install frontend dependencies
	cd frontend && npm install && cd ..

build-ui: ## Build the Next.js production bundle
	cd frontend && npm run build && cd ..

run-ui: ## Start the Next.js development server
	cd frontend && npm run dev && cd ..

test-ui: ## Run frontend Vitest tests
	cd frontend && npm run test && cd ..

lint-ui: ## Run linter checks for frontend code using Biome
	cd frontend && npm run lint && cd ..

format-ui: ## Format frontend source files using Biome
	cd frontend && npm run format && cd ..

# ==============================================================================
# Help
# ==============================================================================

.PHONY: help

help: ## Show this help message
	@echo "Usage: make [target]"
	@echo ""
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'
