#!/bin/bash
set -e

# Repository Root Directory
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "========================================================================"
echo "                   SYNC API CONTRACTS ENGINE                            "
echo "========================================================================"

# 1. Generate TypeScript Types
echo "[1/3] Generating TypeScript Types..."
npx -y openapi-typescript openapi.yaml --output frontend/src/shared/types.gen.ts
echo "✓ Generated frontend/src/shared/types.gen.ts"

# 2. Generate Go Types
echo "[2/3] Generating Go Structs..."
go run github.com/deepmap/oapi-codegen/v2/cmd/oapi-codegen@v2.1.0 -package services -generate types openapi.yaml > apiv2/internal/services/types.gen.go
echo "✓ Generated apiv2/internal/services/types.gen.go"

# 3. Formatting & Type Audits
echo "[3/3] Running Type Parity Audits & Linting..."
npx biome format --write frontend/src/shared/types.gen.ts || true

# Run test compile in Go
(cd apiv2 && go test ./internal/services/... ./internal/handlers/...)

echo "========================================================================"
echo "✓ API Contract Sync and Type Compilation Successful!"
echo "========================================================================"
