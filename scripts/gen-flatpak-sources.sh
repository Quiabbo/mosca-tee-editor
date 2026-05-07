#!/usr/bin/env bash
#
# Generate generated-sources.json for the Flatpak/Flathub manifest.
#
# This file is what allows `npm ci --offline` to work inside the
# Flathub build sandbox (which has no network access).
#
# Requirements: Docker (works on macOS / Windows / Linux).
#
# Output: ./generated-sources.json (in the repo root)
#
# Usage:
#   ./scripts/gen-flatpak-sources.sh
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

if [ ! -f package-lock.json ]; then
  echo "ERROR: package-lock.json not found at repo root."
  echo "Run 'npm install' first to create it."
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: Docker is required."
  echo "Install Docker Desktop: https://www.docker.com/products/docker-desktop/"
  exit 1
fi

echo "==> Running flatpak-node-generator inside Docker..."
docker run --rm \
  -v "$REPO_ROOT":/work \
  -w /work \
  python:3.12-slim bash -lc '
    set -e
    apt-get update -qq >/dev/null
    apt-get install -y --no-install-recommends git ca-certificates >/dev/null
    pip install --quiet --root-user-action=ignore \
      "git+https://github.com/flatpak/flatpak-builder-tools.git#subdirectory=node"
    flatpak-node-generator npm package-lock.json -o generated-sources.json
  '

echo
echo "==> Done. generated-sources.json was written to $REPO_ROOT"
ls -lh generated-sources.json
