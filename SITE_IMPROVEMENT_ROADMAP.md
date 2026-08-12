# SITE_IMPROVEMENT_ROADMAP.md — AutopartsChile.cl

Roadmap vivo, actualizado por ciclos. No se sobrescribe historial.

## FASE 0 — Emergencias (P0, requieren decisión/acceso humano)

1. **Confirmar en el panel de Supabase (Edge Functions → Secrets) si `WEBPAY_ENV=production` está seteado.** El código ya tiene una guarda segura (no usa credenciales de test en modo producción por accidente), pero el valor real de la variable no es legible desde ninguna herramienta conectada. Ver `PAYMENT_SECURITY_AUDIT.md`.
2. **Decidir qué hacer con los 66 productos Dzire 2013 (DZ13-001 a 066): están publicados en el sitio con botón "Pagar ahora" pero no existen en Supabase — el pago falla.** Opciones: (a) confirmar que siguen siendo inventario vigente e insertarlos en Supabase con validación fila por fila, o (b) si algunos ya no son reales, quitar el botón de pago de esos y dejar solo "Consultar por WhatsApp" hasta confirmar. Ver `INVENTORY_RECONCILIATION.md` sección 4.2.

## FASE 1 — Conversión / Datos (ROI inmediato)

3. **Regenerar `data/products.json` y `feed.xml` desde Supabase** para incluir los 53 productos CELAZ que ya existen en la base de datos real pero faltan en el JSON/feed (no requiere inventar nada, no toca HTML ni Supabase, es el fix más seguro y de mayor ROI). Ver `INVENTORY_RECONCILIATION.md` sección 4.1.
4. Agregar schema `Product`/`ItemList` a `repuestos-suzuki-celerio-k10b-azul.html` (55 productos, tarea #293) — gateado a que la Fase 1.3 esté resuelta primero, con backup antes de editar el archivo de 55 KB.
5. **Confirmar con Emir la vigencia de ≥16 SKU de inventario real desconectado** (CEL12 x33 + DZ-001/002 + ALT11-001 + ALT22-001 + motores/cajas completas de alto valor, ver `INVENTORY_RECONCILIATION.md` sección 5) antes de publicarlos — incluye productos de $300.000 a $850.000, el hallazgo de mayor valor potencial de todo el ciclo.

## FASE 2 — Seguridad (parcialmente completada en Ciclo 2)

6. ✅ Completado: código de las 4 Edge Functions de pago auditado (`webpay-create-transaction`, `webpay-confirm`, `mp-create-preference`, `mp-webhook`) — ver `PAYMENT_SECURITY_AUDIT.md`. Confirmado: precio siempre server-side, idempotencia presente, CORS de MP ya corregido.
7. **Decidir sobre `public.oportunidades` sin RLS** — SQL de fix ya preparado (`ALTER TABLE public.oportunidades ENABLE ROW LEVEL SECURITY;`), no aplicado, requiere tu autorización.
8. **Decidir la lógica de descuento de stock al confirmar un pago** — hoy ni Webpay ni Mercado Pago marcan una pieza como vendida automáticamente, riesgo de vender dos veces la misma pieza única.
9. Evaluar si migrar el sitio a un build step ligero permitiría eliminar `unsafe-inline` de la CSP vía nonces — deuda técnica documentada, no urgente.
10. Alinear CORS de `webpay-create-transaction` con el candado ya existente en `mp-create-preference`.

## FASE 3 — UX/UI (pendiente de evidencia visual real)

11. Tomar capturas reales de homepage, catálogo y una página de producto en desktop y mobile (~390px) vía navegador conectado.

## FASE 4 — SEO (continuación del ciclo ya en curso)

12. Completar Fase 1 (sync de inventario) — es simultáneamente SEO y CRO.
13. Auditar sistemáticamente el resto de páginas con producto real para confirmar que ninguna otra tiene el mismo gap de schema o de price mismatch encontrado este ciclo.
14. Retomar el intento de acceso a GA4/GSC cuando el usuario tenga una señal distinta que probar.

## FASE 5 — Performance (pendiente de evidencia real)

15. Correr una auditoría Lighthouse/PageSpeed real contra 2-3 URLs representativas.

## FASE 6 — Analytics

16. GA4 ya está instalado — falta confirmar en vivo si los eventos de conversión están instrumentados.

## FASE 7 — Ecommerce

17. Evaluar el gap de arquitectura de SW-003 (Swift M13A) una vez haya más inventario.

## FASE 8 — Escalabilidad

18. La arquitectura HTML por vehículo escala bien hasta cientos de productos por página. El cuello de botella real es la sincronización manual HTML↔Supabase↔products.json — ver Fase 1 y `INVENTORY_RECONCILIATION.md` sección 2 (recomendación de generar HTML desde Supabase, no editarlo a mano).

## FASE 9 — Multi-marca

19. Sin cambios: no crear páginas de marcas/modelos sin inventario físico real.

## FASE 10 — Premium / Performance / Bodykits

20. Fuera de alcance mientras no exista inventario físico real de esas categorías.
