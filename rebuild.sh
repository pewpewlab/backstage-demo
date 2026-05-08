#!/usr/bin/env bash
# =============================================================================
# rebuild.sh — Full Backstage rebuild & redeploy script
#
# USAGE
#   ./rebuild.sh
#
# WHAT IT DOES
#   This script rebuilds the Backstage Docker image from the current local
#   source code and restarts the Docker Compose stack. Run it any time you
#   make code changes and want them reflected in the running container.
#
#   Step 1 — yarn install --immutable
#     Syncs all Node.js dependencies declared in package.json / yarn.lock
#     without allowing the lockfile to be modified. Ensures the build uses
#     exactly the versions that are committed to the repo.
#
#   Step 2 — yarn tsc
#     Runs the TypeScript compiler across the whole monorepo to catch type
#     errors before attempting a full build. Fails fast so you don't waste
#     time on a Docker build that would error anyway.
#
#   Step 3 — yarn build:backend
#     Compiles and bundles both the frontend (packages/app) and the backend
#     (packages/backend) into production-ready dist artifacts. The backend
#     Dockerfile expects these dist files to already exist before it runs,
#     so this step must come before `docker build`.
#
#   Step 4 — docker build
#     Builds the Docker image using packages/backend/Dockerfile with the
#     repo root as the build context. The resulting image is tagged as
#     $IMAGE (pewpewtron/backstage:copilot).
#     Note: the Dockerfile is a multi-stage build:
#       - Stage 1 (packages)  strips all non-package.json files for layer caching
#       - Stage 2 (build)     installs deps and compiles source
#       - Stage 3 (final)     copies only the production bundle — keeps the
#                             image small and free of dev tooling
#
#   Step 5 — docker compose down + up -d
#     Tears down the running stack (backstage + postgres containers) and
#     brings it back up in detached mode using the freshly built image.
#     Postgres data is preserved in the named volume `backstage_pg_data`.
#
# REQUIREMENTS
#   - Node.js 22 or 24
#   - yarn (berry / v4+)
#   - Docker with BuildKit enabled (default in Docker Desktop)
#   - docker compose v2 (the `docker compose` subcommand, not `docker-compose`)
#
# NOTES
#   - set -euo pipefail causes the script to abort immediately on any error,
#     unset variable, or failed pipe — no silent failures.
#   - To skip the Compose restart and only rebuild the image (e.g. for
#     pushing to a registry), comment out the Step 5 block at the bottom.
# =============================================================================
set -euo pipefail

IMAGE="pewpewtron/backstage:copilot"
COMPOSE_FILE="docker-compose.yml"

log()  { echo "[$(date '+%H:%M:%S')] $*"; }
fail() { echo "[$(date '+%H:%M:%S')] ERROR: $*" >&2; exit 1; }

# ── 1. Install dependencies ──────────────────────────────────────────────────
log "Installing dependencies..."
yarn install --immutable

# ── 2. Type-check ────────────────────────────────────────────────────────────
log "Running TypeScript check..."
yarn tsc

# ── 3. Build backend (bundles frontend + backend) ────────────────────────────
log "Building backend..."
yarn build:backend

# ── 4. Build Docker image ────────────────────────────────────────────────────
log "Building Docker image: $IMAGE"
docker build -f packages/backend/Dockerfile -t "$IMAGE" .

# ── 5. (Re)start compose stack ───────────────────────────────────────────────
log "Restarting compose stack..."
docker compose -f "$COMPOSE_FILE" down
docker compose -f "$COMPOSE_FILE" up -d

log "Done. Backstage is starting at http://localhost:7007"
log "Follow logs with: docker logs -f backstage"
