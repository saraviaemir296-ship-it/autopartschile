# PRICE_STOCK_RECONCILIATION.md

**Ciclo 5 — Reconciliación completa HTML ↔ products.json ↔ Supabase**

Fecha: 2026-08-12

Regla aplicada: **Supabase es la fuente de verdad para cobros.** Este documento es solo diagnóstico — no se modificó ningún precio como resultado de esta reconciliación (los 3 PRICE_MISMATCH reales del catálogo ya habían sido corregidos y verificados en el ciclo anterior, documentados en INVENTORY_RECONCILIATION.md y PAYMENT_SECURITY_AUDIT.md).

## Metodología

- **HTML**: extracción de las 35 páginas de vehículo del sitemap.xml (206 tarjetas de producto con `data-sku`, `rcard-price`, nombre).
- **products.json**: `data/products.json` en GitHub, estado post-sync CELAZ (139 items).
- **Supabase**: consulta fresca a `public.products` (191 filas con `is_active = true`).

## Resumen ejecutivo

- Total tarjetas de producto publicadas en HTML: **206** (205 SKU únicos + 1 SKU repetido en 3 páginas de años distintos).
- **MATCH** (HTML = products.json = Supabase, sin discrepancia de precio, stock > 0): **140**
- **MISSING_SUPABASE** (publicado en HTML pero sin fila en Supabase → checkout roto): **66** — el 100% corresponde a `DZ13-001` a `DZ13-066` (dzire-2013.html). Ver `DZ13_CHECKOUT_RECONCILIATION.md` para el detalle producto por producto.
- **MISSING_SITE** (existe en Supabase, activo, con precio y stock válido, pero no publicado en ninguna página HTML): **53**
- **PRICE_MISMATCH** (HTML vs Supabase): **0** — verificado sobre el 100% del catálogo publicado, no solo muestreo.
- **PRICE_MISMATCH** (products.json vs Supabase): **0**
- **STOCK_MISMATCH** (publicado con stock Supabase = 0): **0**
- **DUPLICATE** (mismo SKU publicado en más de una página): **1 caso, no es error** — `ALTO800-001` aparece en `repuestos-suzuki-alto-800-2016.html`, `repuestos-suzuki-alto-800-2014.html` y `repuestos-suzuki-alto-800-2022.html`. Es intencional (mismo repuesto compatible con 3 generaciones), pero significa que un solo SKU con stock=1 puede recibir 3 intentos de compra simultáneos desde 3 páginas — ver hallazgo de seguridad relacionado en PAYMENT_SECURITY_AUDIT.md (stock no se decrementa al confirmar pago).
- **Posible duplicado de catálogo (no de SKU) que requiere revisión humana**: `SCR-001` ("Focos delanteros LED", $244.990, stock 2) vs `SCROSS-001` ("Foco delantero izquierdo (LH) LED Original", $289.990, stock 1), ambos para Suzuki S-Cross. Nombres y precios distintos — no se puede determinar automáticamente si son el mismo repuesto cargado dos veces con datos distintos, o dos repuestos genuinamente diferentes (par vs. lado izquierdo específico). **REQUIERE CONFIRMACIÓN HUMANA.**

## Tabla completa — productos publicados en HTML (206 filas)

| SKU | Nombre | Archivo | Precio HTML | Precio JSON | Precio Supabase | Stock Supabase | Estado |
|---|---|---|---|---|---|---|---|
| ALTO800-001 | Parachoques delantero | repuestos-suzuki-alto-800-2016.html | $54990 | $54990 | $54990 | 1 | MATCH |
| ALTO800-004 | Bisel de radio | repuestos-suzuki-alto-800-2016.html | $32990 | $32990 | $32990 | 1 | MATCH |
| CELK10-002 | Computador de motor (ECU) K10B mecánico - código HD | repuestos-suzuki-celerio-k10b-gris.html | $168000 | $168000 | $168000 | 1 | MATCH |
| CELK10-004 | Conjunto BCM computador de motor código HD | repuestos-suzuki-celerio-k10b-gris.html | $244990 | $244990 | $244990 | 1 | MATCH |
| CEL0813-001 | Módulo ABS | repuestos-suzuki-celerio-2008.html | $149990 | $149990 | $149990 | 1 | MATCH |
| CEL0813-002 | Caja automática con convertidor | repuestos-suzuki-celerio-2008.html | $389990 | $389990 | $389990 | 1 | MATCH |
| CEL0813-003 | Amortiguadores delanteros (par) | repuestos-suzuki-celerio-2008.html | $59990 | $59990 | $59990 | 1 | MATCH |
| CEL0813-004 | Bidón de agua limpiaparabrisas con motor | repuestos-suzuki-celerio-2008.html | $17990 | $17990 | $17990 | 1 | MATCH |
| CEL0813-005 | Bisagras de capó (par) | repuestos-suzuki-celerio-2008.html | $29990 | $29990 | $29990 | 1 | MATCH |
| CEL0813-006 | Bomba de freno con servo | repuestos-suzuki-celerio-2008.html | $89990 | $89990 | $89990 | 1 | MATCH |
| CEL0813-007 | Brazo limpiaparabrisas | repuestos-suzuki-celerio-2008.html | $19990 | $19990 | $19990 | 1 | MATCH |
| CEL0813-008 | Cañerías de aire acondicionado | repuestos-suzuki-celerio-2008.html | $104990 | $104990 | $104990 | 1 | MATCH |
| CEL0813-009 | Capó original OEM | repuestos-suzuki-celerio-2008.html | $79990 | $79990 | $79990 | 1 | MATCH |
| CEL0813-010 | Chapa de capó | repuestos-suzuki-celerio-2008.html | $17990 | $17990 | $17990 | 1 | MATCH |
| CEL0813-011 | Chapa de capó | repuestos-suzuki-celerio-2008.html | $17990 | $17990 | $17990 | 1 | MATCH |
| CEL0813-012 | Chapa de capó | repuestos-suzuki-celerio-2008.html | $17990 | $17990 | $17990 | 1 | MATCH |
| CEL0813-013 | Compresor de aire acondicionado | repuestos-suzuki-celerio-2008.html | $124990 | $124990 | $124990 | 1 | MATCH |
| CEL0813-014 | Cremallera de dirección | repuestos-suzuki-celerio-2008.html | $99990 | $99990 | $99990 | 1 | MATCH |
| CEL0813-015 | Cuna (soporte) de motor | repuestos-suzuki-celerio-2008.html | $139990 | $139990 | $139990 | 1 | MATCH |
| CEL0813-016 | Depósito de coolant | repuestos-suzuki-celerio-2008.html | $12990 | $12990 | $12990 | 1 | MATCH |
| CEL0813-040 | Soporte de batería | repuestos-suzuki-celerio-2008.html | $19990 | $19990 | $19990 | 1 | MATCH |
| CEL0813-017 | Espejo retrovisor izquierdo | repuestos-suzuki-celerio-2008.html | $44990 | $44990 | $44990 | 1 | MATCH |
| CEL0813-018 | Filtro de aire completo | repuestos-suzuki-celerio-2008.html | $64990 | $64990 | $64990 | 1 | MATCH |
| CEL0813-019 | Foco trasero derecho | repuestos-suzuki-celerio-2008.html | $29990 | $29990 | $29990 | 1 | MATCH |
| CEL0813-020 | Focos delanteros OEM (par) | repuestos-suzuki-celerio-2008.html | $44990 | $44990 | $44990 | 1 | MATCH |
| CEL0813-021 | Kit de aire acondicionado completo | repuestos-suzuki-celerio-2008.html | $229990 | $229990 | $229990 | 1 | MATCH |
| CEL0813-022 | Kit de encendido completo | repuestos-suzuki-celerio-2008.html | $209990 | $209990 | $209990 | 1 | MATCH |
| CEL0813-023 | Mangueras de agua (radiador) | repuestos-suzuki-celerio-2008.html | $9990 | $9990 | $9990 | 1 | MATCH |
| CEL0813-024 | Masas completas con sensor ABS | repuestos-suzuki-celerio-2008.html | $59990 | $59990 | $59990 | 1 | MATCH |
| CEL0813-025 | Mecanismo limpiaparabrisas con motor | repuestos-suzuki-celerio-2008.html | $24990 | $24990 | $24990 | 1 | MATCH |
| CEL0813-026 | Plástico moldura de parabrisas | repuestos-suzuki-celerio-2008.html | $24990 | $24990 | $24990 | 1 | MATCH |
| CEL0813-027 | Polea | repuestos-suzuki-celerio-2008.html | $10000 | $10000 | $10000 | 1 | MATCH |
| CEL0813-028 | Portalón trasero completo | repuestos-suzuki-celerio-2008.html | $124990 | $124990 | $124990 | 1 | MATCH |
| CEL0813-029 | Puerta delantera derecha | repuestos-suzuki-celerio-2008.html | $119990 | $119990 | $119990 | 1 | MATCH |
| CEL0813-030 | Puerta delantera izquierda | repuestos-suzuki-celerio-2008.html | $119990 | $119990 | $119990 | 1 | MATCH |
| CEL0813-031 | Puerta trasera derecha | repuestos-suzuki-celerio-2008.html | $114990 | $114990 | $114990 | 1 | MATCH |
| CEL0813-032 | Puerta trasera izquierda | repuestos-suzuki-celerio-2008.html | $114990 | $114990 | $114990 | 1 | MATCH |
| CEL0813-033 | Radiador con electroventilador (automática) | repuestos-suzuki-celerio-2008.html | $142990 | $142990 | $142990 | 1 | MATCH |
| CEL0813-034 | Soporte de motor | repuestos-suzuki-celerio-2008.html | $29990 | $29990 | $29990 | 1 | MATCH |
| CEL0813-035 | Tablero (torpedo) completo | repuestos-suzuki-celerio-2008.html | $54990 | $54990 | $54990 | 1 | MATCH |
| CEL0813-036 | Tapabarro con foco intermitente | repuestos-suzuki-celerio-2008.html | $34990 | $34990 | $34990 | 1 | MATCH |
| CEL0813-037 | Telecomando (llave con control) | repuestos-suzuki-celerio-2008.html | $59990 | $59990 | $59990 | 1 | MATCH |
| CEL0813-038 | Tensor de correa aire acondicionado | repuestos-suzuki-celerio-2008.html | $49990 | $49990 | $49990 | 1 | MATCH |
| CEL0813-039 | Tercera luz de freno | repuestos-suzuki-celerio-2008.html | $14990 | $14990 | $14990 | 1 | MATCH |
| CEL0813-041 | Portalón trasero | repuestos-suzuki-celerio-2008.html | $129990 | $129990 | $129990 | 1 | MATCH |
| CEL0813-042 | Espejo retrovisor interior | repuestos-suzuki-celerio-2008.html | $24990 | $24990 | $24990 | 1 | MATCH |
| CEL0813-043 | Sombrillas (parasoles) par | repuestos-suzuki-celerio-2008.html | $29990 | $29990 | $29990 | 1 | MATCH |
| CEL0813-044 | BCM (módulo de carrocería) versión AT | repuestos-suzuki-celerio-2008.html | $124990 | $124990 | $124990 | 1 | MATCH |
| CEL0813-045 | Servo de freno con recipiente, versión AT | repuestos-suzuki-celerio-2008.html | $74990 | $74990 | $74990 | 1 | MATCH |
| CEL0813-046 | Cremallera de dirección completa | repuestos-suzuki-celerio-2008.html | $104990 | $104990 | $104990 | 1 | MATCH |
| CEL0813-047 | Ramal eléctrico completo, versión AT y ABS | repuestos-suzuki-celerio-2008.html | $149990 | $149990 | $149990 | 1 | MATCH |
| CEL0813-048 | Soporte de motor lado cuna | repuestos-suzuki-celerio-2008.html | $39990 | $39990 | $39990 | 1 | MATCH |
| CEL0813-049 | Soporte de caja, versión automática 1.0 | repuestos-suzuki-celerio-2008.html | $54990 | $54990 | $54990 | 1 | MATCH |
| CEL0813-050 | Amortiguadores traseros, par | repuestos-suzuki-celerio-2008.html | $44990 | $44990 | $44990 | 1 | MATCH |
| CEL0813-051 | Dirección electroasistida con módulo EPS | repuestos-suzuki-celerio-2008.html | $144990 | $144990 | $144990 | 1 | MATCH |
| CEL0813-052 | Parachoques trasero | repuestos-suzuki-celerio-2008.html | $49990 | $49990 | $49990 | 1 | MATCH |
| CEL0813-053 | Refuerzo trasero de parachoques | repuestos-suzuki-celerio-2008.html | $49990 | $49990 | $49990 | 1 | MATCH |
| CEL0813-054 | Ménsula original | repuestos-suzuki-celerio-2008.html | $8990 | $8990 | $8990 | 2 | MATCH |
| CEL0813-055 | Espirales traseros, par | repuestos-suzuki-celerio-2008.html | $24990 | $24990 | $24990 | 1 | MATCH |
| CEL0813-056 | Muñón completo con ABS | repuestos-suzuki-celerio-2008.html | $59990 | $59990 | $59990 | 2 | MATCH |
| CEL0813-057 | Amortiguador delantero completo | repuestos-suzuki-celerio-2008.html | $39990 | $39990 | $39990 | 2 | MATCH |
| CEL0813-058 | Bandeja de suspensión | repuestos-suzuki-celerio-2008.html | $17990 | $17990 | $17990 | 2 | MATCH |
| CEL0813-059 | Eje trasero completo con ABS | repuestos-suzuki-celerio-2008.html | $184990 | $184990 | $184990 | 1 | MATCH |
| SW-004 | Computador de motor (ECU) automático - código MH | repuestos-suzuki-swift-indio.html | $229990 | $229990 | $229990 | 1 | MATCH |
| ALTO800-001 | Parachoques delantero | repuestos-suzuki-alto-800-2014.html | $54990 | $54990 | $54990 | 1 | MATCH |
| ALTO800-002 | Computador de motor (ECU) F8D - código EV | repuestos-suzuki-alto-800-2014.html | $168990 | $168990 | $168990 | 1 | MATCH |
| ALTO800-003 | Compresor de aire acondicionado | repuestos-suzuki-alto-800-2014.html | $129990 | $129990 | $129990 | 1 | MATCH |
| DZIRE-001 | Foco delantero derecho (RH) LED Original OEM | repuestos-suzuki-dzire.html | $389990 | $389990 | $389990 | 1 | MATCH |
| CIAZ-001 | Caja de cambios mecánica | repuestos-suzuki-ciaz.html | $694990 | $694990 | $694990 | 1 | MATCH |
| DMAX-001 | Condensador aire acondicionado | repuestos-chevrolet-dmax-25-2015-2020.html | $119990 | $119990 | $119990 | 1 | MATCH |
| DMAX-002 | Radiador con embudo | repuestos-chevrolet-dmax-25-2015-2020.html | $229990 | $229990 | $229990 | 1 | MATCH |
| DMAX-003 | Intercooler | repuestos-chevrolet-dmax-25-2015-2020.html | $149990 | $149990 | $149990 | 1 | MATCH |
| DMAX-004 | Foco delantero LED lupa derecho | repuestos-chevrolet-dmax-25-2015-2020.html | $119990 | $119990 | $119990 | 1 | MATCH |
| DMAX-005 | Cardán | repuestos-chevrolet-dmax-25-2015-2020.html | $179990 | $179990 | $179990 | 1 | MATCH |
| DMAX-006 | Capot original OEM | repuestos-chevrolet-dmax-25-2015-2020.html | $144990 | $144990 | $144990 | 1 | MATCH |
| DMAX-007 | Pick up completo | repuestos-chevrolet-dmax-25-2015-2020.html | $649990 | $649990 | $649990 | 1 | MATCH |
| SW-002 | Computador de motor (ECU) M15A - código NC | repuestos-suzuki-swift-15-2010.html | $159990 | $159990 | $159990 | 1 | MATCH |
| SX4-002 | Computador de motor (ECU) AT 1.6 4x4 M16A - código MM | repuestos-suzuki-sx4-hatchback.html | $224990 | $224990 | $224990 | 1 | MATCH |
| ALTO800-001 | Parachoques delantero | repuestos-suzuki-alto-800-2022.html | $54990 | $54990 | $54990 | 1 | MATCH |
| GRANOM-001 | Bobinas de encendido | repuestos-suzuki-grand-nomade-20.html | $29990 | $29990 | $29990 | 4 | MATCH |
| CELAZ-001 | Portón trasero completo con luneta | repuestos-suzuki-celerio-k10b-azul.html | $134990 | $134990 | $134990 | 1 | MATCH |
| CELAZ-002 | Parachoques trasero | repuestos-suzuki-celerio-k10b-azul.html | $57990 | $57990 | $57990 | 1 | MATCH |
| CELAZ-003 | Foco trasero derecho | repuestos-suzuki-celerio-k10b-azul.html | $37990 | $37990 | $37990 | 1 | MATCH |
| CELAZ-004 | Vidrio trasero (luneta) | repuestos-suzuki-celerio-k10b-azul.html | $59990 | $59990 | $59990 | 1 | MATCH |
| CELAZ-005 | Cremallera eléctrica de puerta delantera izquierda | repuestos-suzuki-celerio-k10b-azul.html | $39990 | $39990 | $39990 | 1 | MATCH |
| CELAZ-006 | Botonera de puerta delantera izquierda | repuestos-suzuki-celerio-k10b-azul.html | $27990 | $27990 | $27990 | 1 | MATCH |
| CELAZ-007 | Chapa de puerta delantera izquierda | repuestos-suzuki-celerio-k10b-azul.html | $23990 | $23990 | $23990 | 1 | MATCH |
| CELAZ-008 | Manilla de puerta delantera izquierda | repuestos-suzuki-celerio-k10b-azul.html | $16990 | $16990 | $16990 | 1 | MATCH |
| CELAZ-009 | Puerta trasera derecha completa | repuestos-suzuki-celerio-k10b-azul.html | $124990 | $124990 | $124990 | 1 | MATCH |
| CELAZ-010 | Puerta delantera derecha (copiloto) completa | repuestos-suzuki-celerio-k10b-azul.html | $129990 | $129990 | $129990 | 1 | MATCH |
| CELAZ-011 | Puerta trasera izquierda completa | repuestos-suzuki-celerio-k10b-azul.html | $124990 | $124990 | $124990 | 1 | MATCH |
| CELAZ-012 | Motor completo K10B 1.0 | repuestos-suzuki-celerio-k10b-azul.html | $749990 | $749990 | $749990 | 1 | MATCH |
| CELAZ-013 | Caja de cambios mecánica | repuestos-suzuki-celerio-k10b-azul.html | $339990 | $339990 | $339990 | 1 | MATCH |
| CELAZ-014 | Kit de embrague usado | repuestos-suzuki-celerio-k10b-azul.html | $39990 | $39990 | $39990 | 1 | MATCH |
| CELAZ-015 | Radiador de calefacción | repuestos-suzuki-celerio-k10b-azul.html | $84990 | $84990 | $84990 | 1 | MATCH |
| CELAZ-016 | Escape completo | repuestos-suzuki-celerio-k10b-azul.html | $39990 | $39990 | $39990 | 1 | MATCH |
| CELAZ-017 | Computador de motor (ECU) | repuestos-suzuki-celerio-k10b-azul.html | $159000 | $159000 | $159000 | 1 | MATCH |
| CELAZ-018 | Módulo ABS | repuestos-suzuki-celerio-k10b-azul.html | $139990 | $139990 | $139990 | 1 | MATCH |
| CELAZ-019 | Compresor de aire acondicionado | repuestos-suzuki-celerio-k10b-azul.html | $124990 | $124990 | $124990 | 1 | MATCH |
| CELAZ-020 | Condensador y evaporador con caja de calefacción | repuestos-suzuki-celerio-k10b-azul.html | $149990 | $149990 | $149990 | 1 | MATCH |
| CELAZ-021 | Alternador | repuestos-suzuki-celerio-k10b-azul.html | $79990 | $79990 | $79990 | 1 | MATCH |
| CELAZ-022 | Motor de partida | repuestos-suzuki-celerio-k10b-azul.html | $79990 | $79990 | $79990 | 1 | MATCH |
| CELAZ-023 | Tablero cluster de velocímetro | repuestos-suzuki-celerio-k10b-azul.html | $64990 | $64990 | $64990 | 1 | MATCH |
| CELAZ-024 | Mecanismo motor de limpiaparabrisas delantero | repuestos-suzuki-celerio-k10b-azul.html | $32990 | $32990 | $32990 | 1 | MATCH |
| CELAZ-025 | Intermitente | repuestos-suzuki-celerio-k10b-azul.html | $6990 | $6990 | $6990 | 1 | MATCH |
| CELAZ-026 | Amortiguador delantero completo | repuestos-suzuki-celerio-k10b-azul.html | $36990 | $36990 | $36990 | 1 | MATCH |
| CELAZ-027 | Amortiguador trasero | repuestos-suzuki-celerio-k10b-azul.html | $22990 | $22990 | $22990 | 1 | MATCH |
| CELAZ-028 | Resorte de suspensión (espiral) | repuestos-suzuki-celerio-k10b-azul.html | $8990 | $8990 | $8990 | 1 | MATCH |
| CELAZ-029 | Cremallera de dirección (mecánica) | repuestos-suzuki-celerio-k10b-azul.html | $104990 | $104990 | $104990 | 1 | MATCH |
| CELAZ-030 | Homocinética delantera | repuestos-suzuki-celerio-k10b-azul.html | $89990 | $89990 | $89990 | 1 | MATCH |
| CELAZ-031 | Columna de dirección con módulo EPS | repuestos-suzuki-celerio-k10b-azul.html | $119990 | $119990 | $119990 | 1 | MATCH |
| CELAZ-032 | Bomba de freno (cilindro maestro) | repuestos-suzuki-celerio-k10b-azul.html | $37990 | $37990 | $37990 | 1 | MATCH |
| CELAZ-033 | Servo de freno completo | repuestos-suzuki-celerio-k10b-azul.html | $76990 | $76990 | $76990 | 1 | MATCH |
| CELAZ-034 | Múltiple de admisión | repuestos-suzuki-celerio-k10b-azul.html | $79990 | $79990 | $79990 | 1 | MATCH |
| CELAZ-035 | Múltiple de escape con catalítico | repuestos-suzuki-celerio-k10b-azul.html | $79990 | $79990 | $79990 | 1 | MATCH |
| CELAZ-036 | Culata completa | repuestos-suzuki-celerio-k10b-azul.html | $319990 | $319990 | $319990 | 1 | MATCH |
| CELAZ-037 | Cuerpo de aceleración | repuestos-suzuki-celerio-k10b-azul.html | $109990 | $109990 | $109990 | 1 | MATCH |
| CELAZ-038 | Bobina de encendido (original) | repuestos-suzuki-celerio-k10b-azul.html | $23990 | $23990 | $23990 | 1 | MATCH |
| CELAZ-039 | Sensor CKP (cigüeñal) | repuestos-suzuki-celerio-k10b-azul.html | $49990 | $49990 | $49990 | 1 | MATCH |
| CELAZ-040 | Sensor CMP (árbol de levas) | repuestos-suzuki-celerio-k10b-azul.html | $42990 | $42990 | $42990 | 1 | MATCH |
| CELAZ-041 | Caja de fusibles completa con relés | repuestos-suzuki-celerio-k10b-azul.html | $54990 | $54990 | $54990 | 1 | MATCH |
| CELAZ-042 | Telecomando de luces | repuestos-suzuki-celerio-k10b-azul.html | $28990 | $28990 | $28990 | 1 | MATCH |
| CELAZ-043 | Telecomando de limpiaparabrisas | repuestos-suzuki-celerio-k10b-azul.html | $28990 | $28990 | $28990 | 1 | MATCH |
| CELAZ-044 | Asientos traseros completos | repuestos-suzuki-celerio-k10b-azul.html | $49990 | $49990 | $49990 | 1 | MATCH |
| CELAZ-045 | Tablero torpedo | repuestos-suzuki-celerio-k10b-azul.html | $49990 | $49990 | $49990 | 1 | MATCH |
| CELAZ-046 | Volante | repuestos-suzuki-celerio-k10b-azul.html | $37990 | $37990 | $37990 | 1 | MATCH |
| CELAZ-047 | Palanca de cambios completa | repuestos-suzuki-celerio-k10b-azul.html | $39990 | $39990 | $39990 | 1 | MATCH |
| CELAZ-048 | Cinturones de seguridad delanteros (ambos) | repuestos-suzuki-celerio-k10b-azul.html | $54990 | $54990 | $54990 | 1 | MATCH |
| CELAZ-049 | Consola central | repuestos-suzuki-celerio-k10b-azul.html | $28990 | $28990 | $28990 | 1 | MATCH |
| CELAZ-050 | Guantera (sin chapa) | repuestos-suzuki-celerio-k10b-azul.html | $14990 | $14990 | $14990 | 1 | MATCH |
| CELAZ-051 | Estanque de bencina | repuestos-suzuki-celerio-k10b-azul.html | $54990 | $54990 | $54990 | 1 | MATCH |
| CELAZ-052 | Bomba de bencina | repuestos-suzuki-celerio-k10b-azul.html | $78990 | $78990 | $78990 | 1 | MATCH |
| CELAZ-053 | Muñón completo (versión con ABS) | repuestos-suzuki-celerio-k10b-azul.html | $59990 | $59990 | $59990 | 1 | MATCH |
| CELAZ-054 | Sinóptico-tablero de instrumentos (velocímetro) | repuestos-suzuki-celerio-k10b-azul.html | $64990 | $64990 | $64990 | 1 | MATCH |
| CELAZ-055 | BCM computador de motor código AD | repuestos-suzuki-celerio-k10b-azul.html | $107990 | $107990 | $107990 | 1 | MATCH |
| CELK10-003 | Computador de motor (ECU) K10B automático robotizado (AMT) - código HE | repuestos-suzuki-celerio-k10b-amarillo.html | $194990 | $194990 | $194990 | 1 | MATCH |
| SCROSS-001 | Foco delantero izquierdo (LH) LED Original | repuestos-suzuki-scross.html | $289990 | $289990 | $289990 | 1 | MATCH |
| SPRESSO-001 | Soporte de caja de cambios | repuestos-suzuki-spresso.html | $46990 | $46990 | $46990 | 1 | MATCH |
| SPRESSO-002 | Soporte de distribución | repuestos-suzuki-spresso.html | $47990 | $47990 | $47990 | 1 | MATCH |
| SWGLX-001 | Motor completo 1.2 japonés (tapa plástica) | repuestos-suzuki-swift-glx-12-2012-2017.html | $1078990 | $1078990 | $1078990 | 1 | MATCH |
| DZ13-001 | Capot | repuestos-suzuki-dzire-2013.html | $117990 | — | — | — | MISSING_SUPABASE |
| DZ13-002 | Parachoque delantero completo | repuestos-suzuki-dzire-2013.html | $70000 | — | — | — | MISSING_SUPABASE |
| DZ13-003 | Parachoque trasero completo | repuestos-suzuki-dzire-2013.html | $79990 | — | — | — | MISSING_SUPABASE |
| DZ13-004 | Parrilla delantera | repuestos-suzuki-dzire-2013.html | $28990 | — | — | — | MISSING_SUPABASE |
| DZ13-005 | Guardabarros izquierdo | repuestos-suzuki-dzire-2013.html | $22990 | — | — | — | MISSING_SUPABASE |
| DZ13-006 | Guardabarros derecho | repuestos-suzuki-dzire-2013.html | $22990 | — | — | — | MISSING_SUPABASE |
| DZ13-007 | Tapabarros de lata | repuestos-suzuki-dzire-2013.html | $54990 | — | — | — | MISSING_SUPABASE |
| DZ13-008 | Puertas delanteras completas | repuestos-suzuki-dzire-2013.html | $174990 | — | — | — | MISSING_SUPABASE |
| DZ13-009 | Puertas traseras completas | repuestos-suzuki-dzire-2013.html | $139990 | — | — | — | MISSING_SUPABASE |
| DZ13-010 | Maletero | repuestos-suzuki-dzire-2013.html | $139990 | — | — | — | MISSING_SUPABASE |
| DZ13-011 | Espejos completos | repuestos-suzuki-dzire-2013.html | $59990 | — | — | — | MISSING_SUPABASE |
| DZ13-012 | Tapa combustible | repuestos-suzuki-dzire-2013.html | $14990 | — | — | — | MISSING_SUPABASE |
| DZ13-013 | Refuerzo parachoque delantero original | repuestos-suzuki-dzire-2013.html | $74990 | — | — | — | MISSING_SUPABASE |
| DZ13-014 | Frontal superior | repuestos-suzuki-dzire-2013.html | $64990 | — | — | — | MISSING_SUPABASE |
| DZ13-015 | Laterales frontal izquierdo y derecho | repuestos-suzuki-dzire-2013.html | $32990 | — | — | — | MISSING_SUPABASE |
| DZ13-016 | Focos delanteros | repuestos-suzuki-dzire-2013.html | $68990 | — | — | — | MISSING_SUPABASE |
| DZ13-017 | Focos traseros | repuestos-suzuki-dzire-2013.html | $44990 | — | — | — | MISSING_SUPABASE |
| DZ13-018 | Luneta trasera | repuestos-suzuki-dzire-2013.html | $44990 | — | — | — | MISSING_SUPABASE |
| DZ13-019 | Triangulos plasticos | repuestos-suzuki-dzire-2013.html | $17990 | — | — | — | MISSING_SUPABASE |
| DZ13-020 | Tablero (sin airbags) | repuestos-suzuki-dzire-2013.html | $129990 | — | — | — | MISSING_SUPABASE |
| DZ13-021 | Radio | repuestos-suzuki-dzire-2013.html | $21990 | — | — | — | MISSING_SUPABASE |
| DZ13-022 | Control calefaccion | repuestos-suzuki-dzire-2013.html | $54990 | — | — | — | MISSING_SUPABASE |
| DZ13-023 | Airbag volante | repuestos-suzuki-dzire-2013.html | $124990 | — | — | — | MISSING_SUPABASE |
| DZ13-024 | Airbag copiloto | repuestos-suzuki-dzire-2013.html | $124990 | — | — | — | MISSING_SUPABASE |
| DZ13-025 | Volante | repuestos-suzuki-dzire-2013.html | $49990 | — | — | — | MISSING_SUPABASE |
| DZ13-026 | Consola central | repuestos-suzuki-dzire-2013.html | $23990 | — | — | — | MISSING_SUPABASE |
| DZ13-027 | Palanca cambios completa | repuestos-suzuki-dzire-2013.html | $34990 | — | — | — | MISSING_SUPABASE |
| DZ13-028 | Freno de mano | repuestos-suzuki-dzire-2013.html | $32990 | — | — | — | MISSING_SUPABASE |
| DZ13-029 | Juego pedales | repuestos-suzuki-dzire-2013.html | $74990 | — | — | — | MISSING_SUPABASE |
| DZ13-030 | Cinturones delanteros ambos | repuestos-suzuki-dzire-2013.html | $62990 | — | — | — | MISSING_SUPABASE |
| DZ13-031 | Asientos delanteros ambos | repuestos-suzuki-dzire-2013.html | $104990 | — | — | — | MISSING_SUPABASE |
| DZ13-032 | Asiento trasero | repuestos-suzuki-dzire-2013.html | $49990 | — | — | — | MISSING_SUPABASE |
| DZ13-033 | Parasoles | repuestos-suzuki-dzire-2013.html | $32990 | — | — | — | MISSING_SUPABASE |
| DZ13-034 | Tapiz techo | repuestos-suzuki-dzire-2013.html | $49990 | — | — | — | MISSING_SUPABASE |
| DZ13-035 | Motor completo | repuestos-suzuki-dzire-2013.html | $1079990 | — | — | — | MISSING_SUPABASE |
| DZ13-036 | Multiple admision + cuerpo aceleracion | repuestos-suzuki-dzire-2013.html | $124990 | — | — | — | MISSING_SUPABASE |
| DZ13-037 | Alternador | repuestos-suzuki-dzire-2013.html | $74990 | — | — | — | MISSING_SUPABASE |
| DZ13-038 | Motor partida | repuestos-suzuki-dzire-2013.html | $79990 | — | — | — | MISSING_SUPABASE |
| DZ13-039 | Compresor A/C | repuestos-suzuki-dzire-2013.html | $139990 | — | — | — | MISSING_SUPABASE |
| DZ13-040 | Bomba direccion hidraulica | repuestos-suzuki-dzire-2013.html | $119990 | — | — | — | MISSING_SUPABASE |
| DZ13-041 | ECU + inmovilizador | repuestos-suzuki-dzire-2013.html | $164990 | — | — | — | MISSING_SUPABASE |
| DZ13-042 | Ramal motor | repuestos-suzuki-dzire-2013.html | $134990 | — | — | — | MISSING_SUPABASE |
| DZ13-043 | Catalizador original | repuestos-suzuki-dzire-2013.html | $64990 | — | — | — | MISSING_SUPABASE |
| DZ13-044 | Caja cambios | repuestos-suzuki-dzire-2013.html | $594990 | — | — | — | MISSING_SUPABASE |
| DZ13-045 | Homocineticas completas | repuestos-suzuki-dzire-2013.html | $104990 | — | — | — | MISSING_SUPABASE |
| DZ13-046 | Piolas selectoras | repuestos-suzuki-dzire-2013.html | $74990 | — | — | — | MISSING_SUPABASE |
| DZ13-047 | Soportes caja | repuestos-suzuki-dzire-2013.html | $34990 | — | — | — | MISSING_SUPABASE |
| DZ13-048 | Soporte motor | repuestos-suzuki-dzire-2013.html | $34990 | — | — | — | MISSING_SUPABASE |
| DZ13-049 | Amortiguadores delanteros ambos | repuestos-suzuki-dzire-2013.html | $82990 | — | — | — | MISSING_SUPABASE |
| DZ13-050 | Amortiguadores traseros ambos | repuestos-suzuki-dzire-2013.html | $74990 | — | — | — | MISSING_SUPABASE |
| DZ13-051 | Munones completos con masa | repuestos-suzuki-dzire-2013.html | $76990 | — | — | — | MISSING_SUPABASE |
| DZ13-052 | Bandejas suspension | repuestos-suzuki-dzire-2013.html | $17990 | — | — | — | MISSING_SUPABASE |
| DZ13-053 | Cremallera direccion | repuestos-suzuki-dzire-2013.html | $119990 | — | — | — | MISSING_SUPABASE |
| DZ13-054 | Barra estabilizadora | repuestos-suzuki-dzire-2013.html | $29990 | — | — | — | MISSING_SUPABASE |
| DZ13-055 | Eje trasero completo | repuestos-suzuki-dzire-2013.html | $204990 | — | — | — | MISSING_SUPABASE |
| DZ13-056 | Bomba freno | repuestos-suzuki-dzire-2013.html | $47990 | — | — | — | MISSING_SUPABASE |
| DZ13-057 | Servo freno | repuestos-suzuki-dzire-2013.html | $44990 | — | — | — | MISSING_SUPABASE |
| DZ13-058 | BCM | repuestos-suzuki-dzire-2013.html | $119990 | — | — | — | MISSING_SUPABASE |
| DZ13-059 | Fusilera exterior | repuestos-suzuki-dzire-2013.html | $42990 | — | — | — | MISSING_SUPABASE |
| DZ13-060 | Motor limpiaparabrisas delantero | repuestos-suzuki-dzire-2013.html | $42990 | — | — | — | MISSING_SUPABASE |
| DZ13-061 | Telecomando | repuestos-suzuki-dzire-2013.html | $59990 | — | — | — | MISSING_SUPABASE |
| DZ13-062 | Condensador | repuestos-suzuki-dzire-2013.html | $79990 | — | — | — | MISSING_SUPABASE |
| DZ13-063 | Evaporador | repuestos-suzuki-dzire-2013.html | $67990 | — | — | — | MISSING_SUPABASE |
| DZ13-064 | Electroventilador | repuestos-suzuki-dzire-2013.html | $84990 | — | — | — | MISSING_SUPABASE |
| DZ13-065 | Radiador calefaccion | repuestos-suzuki-dzire-2013.html | $84990 | — | — | — | MISSING_SUPABASE |
| DZ13-066 | Resonador + silenciador completo | repuestos-suzuki-dzire-2013.html | $49990 | — | — | — | MISSING_SUPABASE |

## MISSING_SITE — 53 SKU activos en Supabase, no publicados en ningún HTML

Estos productos **no fueron tocados** en este ciclo (a diferencia de los 53 CELAZ, que sí completaron el proceso de verificación de 8 condiciones y ya fueron sincronizados). Para publicarlos deben pasar por el mismo proceso: backup documental, verificación de las 8 condiciones, y confirmación de que no hay discrepancia entre fuentes antes de tocar HTML/products.json/feed.

| SKU | Nombre | Precio Supabase | Stock Supabase |
|---|---|---|---|
| ALT11-001 | Motor sin culata | $299990 | 1 |
| ALT22-001 | Caja de cambios mecánica | $309990 | 1 |
| CEL0813-060 | Enganche de remolque | $17990 | 1 |
| CEL10-001 | Mangueras de agua (las 2) | $14990 | 1 |
| CEL12-001 | Par de amortiguadores delanteros | $74990 | 1 |
| CEL12-002 | Asiento derecho | $49990 | 1 |
| CEL12-003 | Kit de encendido completo (chapa, llave, inmovilizador y computador) | $244990 | 1 |
| CEL12-004 | Telecomandos | $34990 | 2 |
| CEL12-005 | Puerta trasera derecha | $109990 | 1 |
| CEL12-006 | Foco trasero derecho | $39990 | 1 |
| CEL12-007 | Portalón completo con chapa y luneta | $124990 | 1 |
| CEL12-008 | Puerta trasera izquierda | $109990 | 1 |
| CEL12-009 | Puerta delantera izquierda | $119990 | 1 |
| CEL12-010 | Cremallera de dirección | $89990 | 1 |
| CEL12-011 | Cuna motor | $94990 | 1 |
| CEL12-012 | Bomba de freno + servo (versión automática con sensor) | $89990 | 1 |
| CEL12-013 | Masas completas izq y der (versión ABS) | $74990 | 1 |
| CEL12-014 | Brazo limpiaparabrisas | $19990 | 1 |
| CEL12-015 | Plástico parabrisas | $24990 | 1 |
| CEL12-016 | Mecanismo limpiaparabrisas con motor | $32990 | 1 |
| CEL12-017 | Tablero torpedo completo | $74990 | 1 |
| CEL12-018 | Kit de aire acondicionado completo | $299990 | 1 |
| CEL12-019 | Puerta delantera derecha | $114990 | 1 |
| CEL12-020 | Tapabarros con foco intermitente y guardafango | $59990 | 2 |
| CEL12-021 | Chapa de capot | $24990 | 1 |
| CEL12-022 | Bisagras de capot | $24990 | 1 |
| CEL12-023 | Cañerías aire acondicionado | $59990 | 1 |
| CEL12-024 | Bidón limpiaparabrisas con motores | $29990 | 1 |
| CEL12-025 | Espejo izquierdo | $29990 | 1 |
| CEL12-026 | Soporte de motor | $49990 | 1 |
| CEL12-027 | Filtro de aire completo | $59990 | 1 |
| CEL12-028 | Focos delanteros OEM | $44990 | 1 |
| CEL12-029 | Capot OEM original | $99990 | 1 |
| CEL12-030 | Radiador de agua + electroventilador (versión automática) | $142990 | 1 |
| CEL12-031 | Depósito coolant y soporte de batería | $34990 | 1 |
| CEL12-032 | Compresor aire acondicionado | $129990 | 1 |
| CEL12-033 | Tensor aire acondicionado | $54990 | 1 |
| CELK10-001 | Sinóptico | $74990 | 1 |
| DMAX-008 | Gata original | $44990 | 1 |
| DMAX-009 | Portafiltro de aire con flujómetro | $104990 | 1 |
| DZ-001 | Caja de cambios embrague hidráulico | $409999 | 1 |
| DZ-002 | Culata completa | $349990 | 1 |
| MOT-ALT-F8D | Motor completo F8D 800cc | $649990 | 1 |
| MOT-J20A-001 | Motor completo J20A 2.0 | $894990 | 1 |
| MOT-JGC-001 | Motor V8 5.2 completo | $849990 | 1 |
| MOT-MSV-001 | Motor completo G13B 1.3 | $544990 | 1 |
| MOT-SW15-001 | Motor completo M15A 1.5 | $749990 | 1 |
| SCR-001 | Focos delanteros LED | $244990 | 2 |
| SCR-002 | Llanta de aleación aro 16 | $54990 | 1 |
| SW-001 | Portalón | $169990 | 1 |
| SW-003 | Computador de motor (ECU) M13A - código NF | $164990 | 1 |
| SX4-001 | Cuna de motor | $119990 | 1 |
| TRA-SW15-001 | Caja automática con convertidor incluido | $419990 | 1 |

Nota: este grupo incluye inventario de alto valor no publicado — 33 SKU `CEL12-*` (Celerio celeste, nuevo ingreso), motores completos (`MOT-JGC-001`, `MOT-MSV-001`, `MOT-SW15-001`, `MOT-ALT-F8D`, `MOT-J20A-001`), una caja de transmisión (`TRA-SW15-001`), y otros ya identificados en el ciclo anterior (`INVENTORY_RECONCILIATION.md`).

## Conclusión

El catálogo actualmente publicado (206 tarjetas, 205 SKU únicos) está **100% alineado en precio y stock con Supabase**. No hay ningún producto publicado hoy cuyo precio cobrado difiera del precio mostrado. El único problema de checkout activo es el de los 66 productos DZ13, que nunca tuvieron fila en Supabase (no es una regresión de este ciclo, es una brecha estructural preexistente — ver documento separado).
