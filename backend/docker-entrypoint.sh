#!/bin/sh
set -eu

log() {
  printf '%s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$1"
}

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  log "Applying Prisma migrations"
  ./node_modules/.bin/prisma migrate deploy
fi

if [ "${RUN_SEED:-false}" = "true" ]; then
  log "Applying idempotent production seed"
  npm run prisma:seed
fi

log "Starting Điện Lạnh 247 API"
exec "$@"
