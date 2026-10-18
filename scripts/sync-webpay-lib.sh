#!/usr/bin/env bash
# Copia el módulo compartido de Webpay a cada función que lo usa (Supabase despliega cada carpeta por separado).
set -euo pipefail
cd "$(dirname "$0")/../supabase/functions"
for f in webpay-create-transaction webpay-confirm webpay-reconcile; do
  cp _shared/webpay_lib.ts "$f/webpay_lib.ts"
done
echo "webpay_lib.ts sincronizado"
