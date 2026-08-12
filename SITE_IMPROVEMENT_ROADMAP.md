# SITE_IMPROVEMENT_ROADMAP.md — AutopartsChile.cl

Roadmap vivo, actualizado por ciclos. No se sobrescribe historial.

## FASE 0 — Emergencias (potencial P0)

1. **Confirmar con el usuario si Webpay Plus está en ambiente de producción real de Transbank o todavía en integración/test.** Si sigue en test, el botón de pago debe indicarlo o desactivarse hasta tener credenciales de producción (tarea histórica #210 sigue pendiente). Este es el único hallazgo P0 de este ciclo, y depende de una confirmación humana, no de código.

## FASE 1 — Conversión / Datos (ROI inmediato, ya identificado)

2. Sincronizar los 119 productos reales (CELAZ-001 a 053 + DZ13-001 a 066) a `data/products.json`, `feed.xml` y Merchant Center. Son productos ya vendibles en el sitio que hoy no aparecen en Shopping ni en ningún proceso que dependa de `products.json`.
3. Agregar schema `Product`/`ItemList` a `repuestos-suzuki-celerio-k10b-azul.html` (55 productos, tarea #293).

## FASE 2 — Seguridad

4. Confirmar el estado real (producción vs. integración) de Webpay Plus (ver Fase 0).
5. Leer y auditar el código de las Edge Functions de Supabase (`netlify/functions/` o funciones remotas: `mp-create-preference`, `webpay-create-transaction`, `webpay-confirm`) — no revisado en este ciclo. Buscar: validación de montos server-side, rate limiting, manejo de errores de Transbank/Mercado Pago.
6. Evaluar si migrar el sitio a un build step ligero (esbuild/vite sin framework) permitiría eliminar `unsafe-inline` de la CSP vía nonces — deuda técnica documentada, no urgente.

## FASE 3 — UX/UI (pendiente de evidencia visual real)

7. Tomar capturas reales de homepage, catálogo y una página de producto en desktop y mobile (~390px) vía navegador conectado, para auditar jerarquía visual, CTA above-the-fold, densidad y consistencia de diseño con evidencia real en vez de inferencia sobre el HTML.

## FASE 4 — SEO (continuación del ciclo ya en curso)

8. Completar Fase 1 (sync de inventario) — es simultáneamente SEO y CRO.
9. Auditar sistemáticamente el resto de páginas con producto real para confirmar que ninguna otra tiene el mismo gap de schema que se encontró en 4 páginas este ciclo.
10. Retomar el intento de acceso a GA4/GSC cuando el usuario tenga una señal distinta que probar (la extensión de Chrome sigue fallando de forma genérica, no específica de Search Console).

## FASE 5 — Performance (pendiente de evidencia real)

11. Correr una auditoría Lighthouse/PageSpeed real contra 2-3 URLs representativas (home, catálogo, página de 55 productos como celerio-k10b-azul, que es la más pesada del sitio) para tener LCP/INP/CLS reales, no estimados.

## FASE 6 — Analytics

12. GA4 ya está instalado (tarea histórica #12) — falta confirmar en vivo si los eventos de conversión (clic WhatsApp, clic pagar) están instrumentados, cuando se resuelva el acceso a GA4.

## FASE 7 — Ecommerce

13. Evaluar si vale la pena resolver el gap de arquitectura de SW-003 (Swift M13A) una vez haya más inventario de esa variante específica.

## FASE 8 — Escalabilidad

14. La arquitectura actual (una página HTML estática por vehículo, con `data-sku` hardcodeado en cada card) ya demostró que escala hasta cientos de productos por página (celerio-2008 con 59, dzire-2013 con 66, celerio-azul con 55) sin necesitar una reescritura. El cuello de botella real no es la arquitectura HTML sino la sincronización manual con `products.json`/feed — ver Fase 1.

## FASE 9 — Multi-marca

15. Sin cambios respecto al backlog SEO: no crear páginas de marcas/modelos sin inventario físico real (regla explícita del usuario, ya aplicada consistentemente).

## FASE 10 — Premium / Performance / Bodykits

16. Fuera de alcance mientras no exista inventario físico real de esas categorías.
