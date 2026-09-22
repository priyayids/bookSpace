#!/usr/bin/env bash
# BookSpace — production deploy script for /srv/bookSpace
# Runs as root (invoked by deploy user via sudo NOPASSWD).

set -euo pipefail

APP_DIR="/srv/bookSpace"
COMPOSE_FILE="${APP_DIR}/docker-compose.prod.yml"
HEALTH_URL="http://127.0.0.1:3050/api/health"
LOG="/var/log/bookspace-deploy.log"
HEALTH_TIMEOUT=60

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG"; }

if [ "$(id -u)" -ne 0 ]; then
  log "ERROR: must run as root (use: sudo /usr/local/bin/bookspace-deploy.sh)"
  exit 1
fi

if [ ! -d "$APP_DIR" ]; then
  log "Cloning repository into $APP_DIR..."
  git clone https://github.com/priyayids/bookSpace.git "$APP_DIR"
fi

cd "$APP_DIR"

PREV="$(git rev-parse HEAD 2>/dev/null || echo 'none')"
log "Deploy start: current=$PREV"

git fetch --prune origin main
git reset --hard origin/main
NEW="$(git rev-parse --short HEAD)"
log "Checked out: $NEW"

# Ensure .env exists
if [ ! -f "${APP_DIR}/.env" ]; then
  log "Creating production .env from .env.example..."
  cp "${APP_DIR}/.env.example" "${APP_DIR}/.env"
  sed -i 's|DATABASE_URL=.*|DATABASE_URL="postgresql://bookspace:BookSpaceSecurePass2026!@db:5432/bookspace?schema=public"|' "${APP_DIR}/.env"
  sed -i 's|NODE_ENV=.*|NODE_ENV=production|' "${APP_DIR}/.env"
  sed -i 's|PORT=.*|PORT=3000|' "${APP_DIR}/.env"
  sed -i 's|FRONTEND_URL=.*|FRONTEND_URL=https://bookspace.app-cube.tech|' "${APP_DIR}/.env"
  sed -i 's|BACKEND_URL=.*|BACKEND_URL=https://bookspace.app-cube.tech|' "${APP_DIR}/.env"
fi

log "Building BookSpace images..."
docker compose -f "$COMPOSE_FILE" build

log "Starting database container..."
docker compose -f "$COMPOSE_FILE" up -d db

log "Waiting for database readiness..."
DB_READY=0
for i in $(seq 1 30); do
  if docker compose -f "$COMPOSE_FILE" exec -T db pg_isready -U bookspace -d bookspace >/dev/null 2>&1; then
    log "Database ready after ${i}s"
    DB_READY=1
    break
  fi
  sleep 1
done

if [ "$DB_READY" -eq 0 ]; then
  log "ERROR: Database failed to start after 30s"
  exit 1
fi

log "Running Prisma database migrations..."
docker compose -f "$COMPOSE_FILE" run --rm app sh -c 'node /app/node_modules/.pnpm/prisma@*/node_modules/prisma/build/index.js migrate deploy'

log "Checking and seeding initial data if needed..."
docker compose -f "$COMPOSE_FILE" run --rm app node -e "
import('./dist/prisma/client.js').then(async ({ prisma }) => {
  const count = await prisma.room.count();
  if (count === 0) {
    console.log('No rooms found. Seeding initial test rooms and bookings...');
    await import('./dist/seed.js');
  } else {
    console.log('Database already populated (' + count + ' rooms). Skipping seed.');
  }
}).catch(err => {
  console.error('Seed check error:', err);
  process.exit(1);
});
"

log "Starting backend and frontend containers..."
docker compose -f "$COMPOSE_FILE" up -d

log "Waiting for backend health at $HEALTH_URL (up to ${HEALTH_TIMEOUT}s)..."
HEALTHY=0
for i in $(seq 1 "$HEALTH_TIMEOUT"); do
  if curl -fsS -o /dev/null "$HEALTH_URL"; then
    log "Health OK after ${i}s"
    HEALTHY=1
    break
  fi
  sleep 1
done

if [ "$HEALTHY" -eq 0 ]; then
  log "ERROR: Health check failed after ${HEALTH_TIMEOUT}s"
  docker compose -f "$COMPOSE_FILE" logs --tail=50
  exit 1
fi

docker compose -f "$COMPOSE_FILE" ps
log "BookSpace deployment completed successfully!"
