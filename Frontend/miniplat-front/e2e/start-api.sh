#!/bin/sh
# Starts the database and then the API, in that order.
#
# Both are one command step on purpose: the API migrates and seeds at startup and will not
# start without a database to do it against, and Playwright gives no guarantee that
# globalSetup runs before webServer. As one step the order cannot be got wrong.
set -e

CONTAINER="${E2E_DB_CONTAINER:-miniplat-e2e-db}"
PORT="${E2E_DB_PORT:-55432}"

docker rm -f "$CONTAINER" >/dev/null 2>&1 || true

docker run -d --name "$CONTAINER" \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=MiniPlatE2E \
  -p "$PORT":5432 \
  postgres:17 >/dev/null

i=0
until docker exec "$CONTAINER" pg_isready -U postgres >/dev/null 2>&1; do
  i=$((i + 1))
  if [ "$i" -gt 60 ]; then
    echo "The database was not ready within 60 seconds." >&2
    exit 1
  fi
  sleep 1
done

exec dotnet run --project "$E2E_API_PROJECT" --no-launch-profile -c Release
