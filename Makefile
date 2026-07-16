.PHONY: docker-build docker-run docker-stop docker-logs docker-shell docker-clean help

docker-build: ## Build the V2 dev container image using Podman
	podman build -t cover-craft-dev-v2:latest -f Dockerfile.v2 .

docker-run: ## Run the V2 dev container with volume mounts and port mappings
	podman run -d --rm \
		-p 3000:3000 \
		-p 7071:7071 \
		-p 10000:10000 \
		-p 10001:10001 \
		-p 10002:10002 \
		-v .:/app:Z \
		--name cover-craft-dev-container-v2 \
		cover-craft-dev-v2:latest

docker-stop: ## Stop the running V2 dev container
	podman stop cover-craft-dev-container-v2

docker-logs: ## Tail the logs of the running V2 container
	podman logs -f cover-craft-dev-container-v2

docker-shell: ## Open an interactive bash shell inside the running V2 container
	podman exec -it cover-craft-dev-container-v2 /bin/bash

docker-clean: ## Remove the V2 dev container image
	podman rmi cover-craft-dev-v2:latest

help: ## Show this help message
	@echo "Usage: make [target]"
	@echo ""
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'
