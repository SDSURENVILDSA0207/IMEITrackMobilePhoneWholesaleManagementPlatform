#!/usr/bin/env bash
set -euo pipefail
docker compose -f infra/docker/docker-compose.dev.yml up -d
npx pnpm dev
