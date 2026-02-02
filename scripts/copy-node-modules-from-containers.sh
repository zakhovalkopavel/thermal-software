#!/usr/bin/env bash
# Robust tar-stream copy: stream /app/node_modules from container and extract on host
# Usage: ./scripts/copy-node-modules-from-containers.sh [--force]
# Date: 2026-02-02

set -euo pipefail

FORCE=0
if [[ ${1:-} == "--force" || ${1:-} == "-f" ]]; then
  FORCE=1
fi

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." >/dev/null 2>&1 && pwd)"
SERVICES=(backend frontend)

echo "[info] Project root: $PROJECT_ROOT"
for svc in "${SERVICES[@]}"; do
  HOST_SERVICE_DIR="$PROJECT_ROOT/$svc"
  HOST_NODE_MODULES="$HOST_SERVICE_DIR/node_modules"

  echo "[info] Service: $svc"

  container_id=$(docker compose ps -q "$svc" 2>/dev/null || true)
  if [ -z "$container_id" ]; then
    echo "[warn] No running container found for service '$svc' (container id is empty). Skipping."
    continue
  fi
  echo "[info] container id: $container_id"

  echo "[info] Streaming tar from container and extracting to $HOST_SERVICE_DIR (no ownership preserved)"
  # Use pipefail to catch errors from either side
  set -o pipefail
  sudo chown -R "$(id -u):$(id -g)" "$HOST_NODE_MODULES"
  if docker exec -u root "$container_id" sh -c "cd /app && tar -cf - node_modules" | tar -C "$HOST_SERVICE_DIR" -x --no-same-owner --no-overwrite-dir; then
    echo "[ok] Extracted node_modules for $svc to $HOST_SERVICE_DIR/node_modules"
    # Try to chown to current user (best-effort)
    if sudo chown -R "$(id -u):$(id -g)" "$HOST_NODE_MODULES" >/dev/null 2>&1; then
      echo "[ok] Adjusted ownership to $(id -u):$(id -g) $HOST_NODE_MODULES"
    else
      echo "[warn] Unable to chown $HOST_NODE_MODULES. You may need to run: sudo chown -R $(id -u):$(id -g) $HOST_NODE_MODULES"
    fi
  else
    echo "[error] Tar-stream copy failed for $svc. Ensure tar exists in the container and /app/node_modules is present." >&2
    # Show a short diagnostic listing inside the container
    echo "[diag] Listing /app in container:"
    docker exec "$container_id" ls -la /app || true
    continue
  fi
done

echo "[done] All services processed"
