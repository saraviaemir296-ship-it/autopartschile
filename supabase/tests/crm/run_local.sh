#!/usr/bin/env bash
# Prueba las migraciones del CRM en un Postgres local (réplica mínima de Supabase). No toca producción.
# Uso: sudo bash supabase/tests/crm/run_local.sh
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"; mig="$here/../../migrations"
tmp="$(mktemp -d)"; cp "$here"/*.sql "$mig"/20261112*_crm_*.sql "$tmp"/; chmod -R a+rX "$tmp"
su postgres -c "dropdb --if-exists crm_test && createdb crm_test"
run() { su postgres -c "psql -q -v ON_ERROR_STOP=1 -d crm_test -f $tmp/$1" >/dev/null; }
run 00_stub_supabase_local.sql
for f in "$tmp"/20261112*_crm_*.sql; do run "$(basename "$f")"; done
su postgres -c "psql -d crm_test -P pager=off -c 'select n, ok, prueba, detalle from public.crm_selftest()'"
su postgres -c "psql -d crm_test -P pager=off -f $tmp/10_regresion_checkout.sql"
