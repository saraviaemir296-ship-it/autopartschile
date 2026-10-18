# Pruebas Webpay (simuladas)

Simulan Transbank y la base de datos en memoria para cubrir: aprobado, rechazado, timeouts,
retornos dobles, sin stock, errores de base de datos, anulaciones falsas y el reconciliador.

Ejecutar (desde esta carpeta):

    T=$(mktemp -d); cp sb_mock.ts webpay_test.ts $T/
    sed 's#from "jsr:@supabase/supabase-js@2"#from "./sb_mock.ts"#' ../_shared/webpay_lib.ts > $T/webpay_lib.ts
    for f in webpay-confirm webpay-reconcile webpay-create-transaction; do sed '/functions-js\/edge-runtime/d' ../$f/index.ts > $T/$f.ts; done
    deno run --no-check --allow-env $T/webpay_test.ts
