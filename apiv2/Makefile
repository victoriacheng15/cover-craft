.PHONY: update fmt lint test test-bdd test-all cov cov-bdd build run help clean

update: ## Update dependencies and tidy go.mod
	go get -u ./...
	go mod tidy

fmt: ## Format Go source files
	go fmt ./cmd/... ./internal/...

lint: ## Run static analysis checks (go vet)
	go vet ./cmd/... ./internal/...

test: ## Run unit tests
	go test ./internal/...

test-bdd: ## Run BDD end-to-end features
	go test ./e2e/...

test-all: test test-bdd ## Run all unit and BDD tests

cov: ## Run tests and print terminal coverage summary
	go test -coverprofile=coverage.out ./internal/...
	go tool cover -func=coverage.out
	rm -f coverage.out

cov-bdd: ## Run BDD features and print coverage summary
	go test -count=1 -coverprofile=coverage_bdd.out -coverpkg=./internal/... ./e2e/...
	go tool cover -func=coverage_bdd.out
	rm -f coverage_bdd.out

build: ## Compile the application binary
	mkdir -p bin
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o bin/apiv2-handler cmd/handler/main.go

run: build ## Compile binary, start Azurite in background, and start Functions host
	mkdir -p ../__azurite_db__
	npx azurite --silent --location ../__azurite_db__ &
	func start

clean: ## Remove build and coverage artifacts
	rm -rf bin/ coverage.out

help: ## Show this help message
	@echo "Usage: make [target]"
	@echo ""
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-10s %s\n", $$1, $$2}'
