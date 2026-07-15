# ==============================================================================
# Podman & Execution Guide
# ==============================================================================
# Build command:
#   podman build -t cover-craft-all-in-one:latest -f docs/docker/Dockerfile .
#
# Run command:
#   podman run -d \
#     -p 3000:3000 \
#     -p 7071:7071 \
#     -p 10000:10000 \
#     -p 10001:10001 \
#     -p 10002:10002 \
#     --name cover-craft-mono \
#     cover-craft-all-in-one:latest
#
# Rootless Podman & SELinux Configuration:
#   - Ports exposed are above 1024, so no root privileges are required on host.
#   - If mounting host directories (e.g. for Azurite database persistence), append
#     the ':Z' flag to update SELinux labels, and optionally use '--userns=keep-id':
#     podman run -d -p 3000:3000 -p 7071:7071 -p 10000:10000 -p 10001:10001 -p 10002:10002 \
#       -v ./__azurite_db__:/app/__azurite_db__:Z \
#       --userns=keep-id \
#       --name cover-craft-mono \
#       cover-craft-all-in-one:latest
# ==============================================================================

# ==============================================================================
# 1. Base Stage (Debian-based Node 24)
# ==============================================================================
FROM node:24-slim AS base
WORKDIR /app

# ==============================================================================
# 2. Shared Library Builder
# ==============================================================================
FROM base AS shared-builder
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
RUN npm ci -w @cover-craft/shared --include-workspace-root
COPY . .
RUN npm run build:shared

# ==============================================================================
# 3. Frontend Builder (Isolated Compilation)
# ==============================================================================
FROM base AS frontend-builder
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY frontend/package.json ./frontend/

# Clean install frontend dependencies
RUN npm ci -w frontend --include-workspace-root --ignore-scripts

# Copy source and built shared package
COPY --from=shared-builder /app/shared/dist ./shared/dist
COPY . .

# Compile Next.js frontend
RUN npm run build --workspace=frontend

# ==============================================================================
# 4. API Builder (Isolated Compilation with Native Build Tools)
# ==============================================================================
FROM base AS api-builder
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY api/package.json ./api/

# Clean install API dependencies (triggers native canvas build)
RUN npm ci -w api --include-workspace-root --ignore-scripts

COPY . .
# Copy built shared package AFTER copying source files to avoid overwriting
COPY --from=shared-builder /app/shared/dist ./shared/dist

# Compile API workspace
RUN npm run build --workspace=api

# ==============================================================================
# 5. Final Stage: Monolithic Production Runner (Debian-slim)
# ==============================================================================
FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install runtime dependencies for canvas and process supervision
RUN apt-get update && apt-get install -y --no-install-recommends \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    procps \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install PM2 and Azure Functions Core Tools globally
RUN npm install -g pm2 azure-functions-core-tools@4 --unsafe-perm

# Copy built API and its runtime node_modules
COPY --from=api-builder /app/package.json /app/package-lock.json ./
COPY --from=api-builder /app/node_modules ./node_modules
COPY --from=api-builder /app/shared ./shared
COPY --from=api-builder /app/api ./api

# Copy built Frontend standalone output into an isolated directory to prevent node_modules conflicts
COPY --from=frontend-builder /app/frontend/public ./frontend-standalone/frontend/public
COPY --from=frontend-builder /app/frontend/.next/standalone ./frontend-standalone
COPY --from=frontend-builder /app/frontend/.next/static ./frontend-standalone/frontend/.next/static

# Setup non-root execution user and create home directory for PM2 configuration storage
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs --create-home appuser && \
    chown -R appuser:nodejs /app

# Write PM2 configuration to manage all three local processes
RUN echo '{\
  "apps": [\
    {\
      "name": "frontend",\
      "script": "frontend/server.js",\
      "cwd": "/app/frontend-standalone",\
      "env": {\
        "PORT": "3000",\
        "HOSTNAME": "0.0.0.0"\
      }\
    },\
    {\
      "name": "api",\
      "script": "func",\
      "args": "start",\
      "cwd": "/app/api",\
      "exec_mode": "fork",\
      "interpreter": "none",\
      "env": {\
        "AzureWebJobsStorage": "UseDevelopmentStorage=true"\
      }\
    },\
    {\
      "name": "azurite",\
      "script": "/app/node_modules/.bin/azurite",\
      "args": "--silent --location /app/__azurite_db__",\
      "cwd": "/app",\
      "exec_mode": "fork",\
      "interpreter": "none"\
    }\
  ]\
}' > /app/processes.json

USER appuser
EXPOSE 3000 7071 10000 10001 10002

CMD ["pm2-runtime", "/app/processes.json"]
