#!/usr/bin/env bash
set -euo pipefail

root_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
cd "$root_dir"
mkdir -p deploy/env deploy/certs phase15-evidence

app_password=$(openssl rand -hex 18)
root_password=$(openssl rand -hex 18)
access_secret=$(openssl rand -hex 32)
refresh_secret=$(openssl rand -hex 32)
audit_secret=$(openssl rand -hex 32)
admin_password="P15$(openssl rand -hex 12)Aa1"

cat > deploy/env/production.env <<'ENV'
APP_VERSION=phase15-ci
USER_DOMAIN=dienlanh247.local
ADMIN_DOMAIN=admin.dienlanh247.local
ENV

cat > deploy/env/database.env <<ENV
MYSQL_DATABASE=dien_lanh_247
MYSQL_USER=dl247_app
MYSQL_PASSWORD=${app_password}
MYSQL_ROOT_PASSWORD=${root_password}
TZ=Asia/Bangkok
ENV

cat > deploy/env/backend.env <<ENV
DATABASE_URL=mysql://dl247_app:${app_password}@db:3306/dien_lanh_247
JWT_ACCESS_SECRET=${access_secret}
JWT_REFRESH_SECRET=${refresh_secret}
AUDIT_LOG_HASH_SALT=${audit_secret}
ADMIN_SEED_EMAIL=admin-phase15@example.test
ADMIN_SEED_PASSWORD=${admin_password}
RUN_MIGRATIONS=true
RUN_SEED=true
BACKUP_RETENTION_DAYS=14
LOG_LEVEL=info
THROTTLE_TTL_MS=60000
THROTTLE_LIMIT=500
ENV
chmod 600 deploy/env/*.env

USER_DOMAIN=dienlanh247.local \
ADMIN_DOMAIN=admin.dienlanh247.local \
sh deploy/scripts/generate-local-cert.sh

if ! grep -q 'dienlanh247.local' /etc/hosts; then
  echo '127.0.0.1 dienlanh247.local admin.dienlanh247.local' | sudo tee -a /etc/hosts >/dev/null
fi

compose=(docker compose --env-file deploy/env/production.env -f docker-compose.production.yml)

cleanup() {
  "${compose[@]}" logs --no-color > phase15-evidence/container.log 2>&1 || true
  "${compose[@]}" down -v --remove-orphans || true
}
trap cleanup EXIT

"${compose[@]}" config --quiet
"${compose[@]}" build --pull 2>&1 | tee phase15-evidence/docker-build.log
"${compose[@]}" up -d

ready=false
for attempt in $(seq 1 90); do
  if curl -kfsS https://dienlanh247.local/api/v1/health/ready >/dev/null; then
    ready=true
    break
  fi
  sleep 3
done
if [ "$ready" != true ]; then
  "${compose[@]}" ps
  exit 1
fi
"${compose[@]}" ps | tee phase15-evidence/compose-ps.log

NODE_TLS_REJECT_UNAUTHORIZED=0 \
USER_SMOKE_URL=https://dienlanh247.local \
ADMIN_SMOKE_URL=https://admin.dienlanh247.local \
API_SMOKE_URL=https://dienlanh247.local/api/v1 \
node scripts/smoke-production.mjs 2>&1 | tee phase15-evidence/production-smoke.log

started_at=$(date +%s)
"${compose[@]}" exec -T backend node scripts/backup-mysql.mjs 2>&1 | tee phase15-evidence/backup.log
backup_file=$("${compose[@]}" exec -T backend sh -c 'ls -1t /app/var/backups/*.sql.gz | head -1' | tr -d '\r')
test -n "$backup_file"

"${compose[@]}" exec -T db sh -lc 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot' <<'SQL'
CREATE DATABASE dien_lanh_247_restore CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON dien_lanh_247_restore.* TO 'dl247_app'@'%';
FLUSH PRIVILEGES;
SQL

restore_url="mysql://dl247_app:${app_password}@db:3306/dien_lanh_247_restore"
"${compose[@]}" exec -T \
  -e NODE_ENV=test \
  -e DATABASE_URL="$restore_url" \
  -e RESTORE_CONFIRM=dien_lanh_247_restore \
  -e RESTORE_FILE="$backup_file" \
  backend node scripts/restore-mysql.mjs 2>&1 | tee phase15-evidence/restore.log

"${compose[@]}" exec -T \
  -e DATABASE_URL="$restore_url" \
  backend ./node_modules/.bin/prisma migrate deploy 2>&1 | tee phase15-evidence/restore-migrate.log

restored_users=$("${compose[@]}" exec -T db sh -lc \
  'MYSQL_PWD="$MYSQL_PASSWORD" mysql -u"$MYSQL_USER" dien_lanh_247_restore -Nse "SELECT COUNT(*) FROM User;"' \
  | tr -d '\r')
test "$restored_users" -ge 1

finished_at=$(date +%s)
printf 'backup_file=%s\nrestored_users=%s\nrestore_rto_seconds=%s\n' \
  "$backup_file" "$restored_users" "$((finished_at-started_at))" \
  | tee phase15-evidence/recovery-metrics.txt

NODE_TLS_REJECT_UNAUTHORIZED=0 \
USER_SMOKE_URL=https://dienlanh247.local \
ADMIN_SMOKE_URL=https://admin.dienlanh247.local \
API_SMOKE_URL=https://dienlanh247.local/api/v1 \
node scripts/smoke-production.mjs 2>&1 | tee phase15-evidence/post-recovery-smoke.log

printf 'Phase 15 production deployment and recovery drill passed.\n'
