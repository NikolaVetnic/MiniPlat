#!/bin/sh
# Starter databasen og deretter API-et, i den rekkefølgen.
#
# Begge er ett kommandotrinn med vilje: API-et migrerer og seeder ved oppstart og starter
# ikke uten en database å gjøre det mot, og Playwright gir ingen garanti for at globalSetup
# kjører før webServer. Her er rekkefølgen umulig å ta feil av.
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
    echo "Databasen ble ikke klar innen 60 sekunder." >&2
    exit 1
  fi
  sleep 1
done

exec dotnet run --project "$E2E_API_PROJECT" --no-launch-profile -c Release
