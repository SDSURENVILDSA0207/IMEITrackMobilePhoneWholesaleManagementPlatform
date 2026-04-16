#!/bin/sh
set -e

if [ "${APP_ENV}" = "production" ]; then
  echo "Running Alembic migrations (production)..."
  alembic upgrade head
else
  echo "Running Alembic migrations (non-production; failures tolerated if no revisions yet)..."
  alembic upgrade head || echo "WARN: alembic upgrade skipped or failed; development mode may use create_all on startup."
fi

exec uvicorn app.main:app \
  --host "${UVICORN_HOST:-0.0.0.0}" \
  --port "${UVICORN_PORT:-8000}" \
  --proxy-headers \
  "$@"
