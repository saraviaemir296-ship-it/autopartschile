# Rendimiento del sitio y de todas las áreas de marketing (26-nov-2026)

Regla: solo números que salen de una fuente real. Donde no hay fuente conectada, dice "sin fuente".

## 1. Sitio web (autopartschile.cl, Netlify)

**Tráfico (Netlify, solo las últimas ~33 h: el plan actual guarda 1 día de registros):**

| Tipo de visitante | Peticiones |
|---|---|
| Navegadores (personas) | 1.748 |
| Rastreadores (Google, Bing…) | 1.094 |
| Agentes de IA (ChatGPT y similares) | 276 |
| Previsualizaciones (WhatsApp, redes) | 596 |

- Respuestas 404: 777, casi todas escaneos de bots buscando `.env`, `.git`, `wp-config` en la URL interna de Netlify. No son visitantes perdidos; conviene que el dominio interno `*.netlify.app` no sea indexable (hay 154 visitas desde una búsqueda de Google a ese nombre).
- Fuentes reales observadas: Perfil de Negocio de Google (79 visitas con utm `perfil-negocio`), ChatGPT (43 visitas a la ficha de la caja de cambios K12M del Swift con `utm_source=chatgpt.com`), catálogo y páginas de vehículos.

**Conversión (Supabase, histórico completo):**

| Mes | Pedidos creados | Pagados | $ pagado | Cancelados |
|---|---|---|---|---|
| 2026-06 | 7 | 0 | 0 | 0 |
| 2026-07 | 5 | 0 | 0 | 3 |
| 2026-08 | 1 | 0 | 0 | 0 |
| 2026-09 | 15 | 4 | 119.960 | 9 |
| 2026-10 | 15 | 2 | 1.050 | 11 |
| 2026-11 | 3 | 1 | 60.000 | 0 |

- 46 pedidos en total: 7 pagados por Webpay, 23 cancelados en Webpay, 16 de Mercado Pago que nunca pasaron de "pendiente".
- **Corrección (26-nov, segunda revisión):** de esos 16 de Mercado Pago, solo **3 son clientes reales** (21-nov $90.000 homocinética Swift, 7-nov $39.990 foco Swift, 18-oct $149.990 airbag Alto). Los otros 13 son 6 pruebas de Emir y 7 pedidos de prueba importados de WooCommerce en junio ("Test", "#99999"). El flujo de Mercado Pago sí está completo (`mp-create-preference` → `notification_url` → `mp-webhook` confirma y descuenta stock); esos 3 clientes simplemente no pagaron. Monto real recuperable: $279.980, no $1,6 M.
- **Tasa de pago real** descontando pruebas: 7 pagados de 33 pedidos reales ≈ 21 %.
- **Las ventas de verdad no pasan por la web.** La caja registrada en finance-bot (esquema `finance`) muestra en noviembre **$7.091.990 en 70 ventas**, contra $430.000 en 4 pedidos web+manuales. La web es una vitrina; la venta se cierra por WhatsApp, Marketplace y en el local. El Centro de Mando ahora muestra ambas cifras.
- Clics en "Cotizar por WhatsApp" (quote_events): julio 39 → agosto 124 → septiembre 86 → octubre 57 → noviembre 36. **Baja sostenida desde agosto.**
- Formularios de cotización web: 5 en total (sept 1, oct 3, nov 1). Los 5 siguen sin respuesta desde el 13-nov (ya los tomó el Recepcionista).
- Ciudades de los clics: Santiago 170, Molina 16, Valparaíso 12, Concepción 8.
- Productos activos en la web: 1.032. Creados por mes: jul 128, ago 91, sep 25, oct 382, nov 629. **El inventario publicado se multiplicó, el tráfico no.**
- Newsletter: 0 suscriptores. Tarjeta Saravia: 0 solicitudes.

**SEO (última auditoría real con Search Console: 12-ago-2026, `SEO_AUDIT_REPORT.md`):** 138 clics en 7 semanas; conflicto de canónicas que bloqueaba la indexación de 13 de 51 páginas; demanda llegando a páginas sin inventario (Kia Optima híbrido). Search Console **no está conectado a esta sesión**: no puedo decir si eso se corrigió ni cómo está el tráfico orgánico hoy. Semrush está conectado pero **sin unidades de API** (no entrega datos).

**GEO (presencia en asistentes de IA):** hay señal real: ChatGPT envió tráfico a una ficha de repuesto en el último día y 276 peticiones de agentes de IA. El archivo `llms.txt` existe. No hay medición continua.

## 2. Anuncios (Meta Ads, cuenta 1116318899734886, últimos 90 días, datos reales de la API)

| Campaña (publicación de Marketplace impulsada) | Gasto | Alcance | Clics | Conversaciones iniciadas | Costo por conversación |
|---|---|---|---|---|---|
| Motor Swift 1.2 K12B (12–19 nov) | $13.960 | 12.123 | 603 | 12 | $1.163 |
| Desarme Hyundai Santa Fe 2.4 (11–14 nov) | $5.953 | 6.763 | 264 | 18 | $331 |
| Desarme Swift 1.2 indio K12M (11–14 nov) | $5.954 | 7.877 | 388 | 34 | $175 |
| Desarme SX4 1.6 M16A (11–14 nov) | $5.974 | 8.438 | 193 | 11 | $543 |
| Desarme Celerio K10B 2008-2014 (11–14 nov) | $2.973 | 3.653 | 111 | 9 | $330 |
| Culata SX4/Liana/Aerio (5–6 nov) | $998 | 2.527 | 102 | 1 | $998 |

- Total noviembre: **$35.812 gastados → 85 conversaciones iniciadas** (costo medio $421). Los anuncios de "desarme completo" convierten 3 a 6 veces mejor que los de una pieza sola.
- Las conversaciones que generan esos anuncios llegan a Messenger/Marketplace. **Ninguna está en el CRM**: `crm_conversations` solo tiene 5 leads web. El agente de Instagram/Messenger de Supabase nunca ha funcionado (faltan los secretos de Meta). Hoy se paga por conversaciones que después no se siguen con sistema.
- 5 campañas antiguas (marzo–agosto) con $0 de gasto siguen "activas": ruido en la cuenta.
- Página: "Autoparts Chile" (762247893633542). Instagram: @desarmaduria.saravia. También existen las páginas "Grúas Saravia" y "Copiloto Peludo".

## 3. Mercado Libre (cuenta SAEM908803, datos de la base)

- 46 publicaciones activas, 27 pausadas, 0 preguntas pendientes, última sincronización 20-nov.
- Funciones ya existentes: publicar, repreciar, preguntas (cada 5 min), auditoría, pausar al vender.
- Nuevo hoy: agente diario (8:10) que detecta activas sin stock, pausadas con stock, publicables sin publicar y preguntas sin responder, y lo deja como tareas para tu OK.

## 4. Redes sociales

- Sin fuente conectada para métricas orgánicas de Instagram/Facebook (seguidores, alcance de publicaciones). Solo se ven las publicaciones impulsadas (sección 2).
- Para publicar desde el sistema hacen falta los tokens de Meta en Supabase (los mismos que necesita el agente de Messenger/Instagram).

## 5. Lectura directa

1. **El problema no es tráfico de bots ni velocidad: es que la demanda pagada va a Messenger y muere ahí.** 85 conversaciones compradas en noviembre y cero en el CRM.
2. **La web convierte poco pero no está rota**: ~21 % de los pedidos reales se pagan y el webhook de Mercado Pago funciona. Quedaron 3 clientes reales sin pagar ($279.980); el nuevo agente Recuperador de pagos les propone el WhatsApp (ya hay 1 propuesta esperando tu OK; los otros 2 son más antiguos de 14 días o no dejaron teléfono).
3. **El interés por WhatsApp cae desde agosto** mientras el catálogo crece: publicar más piezas no está trayendo más gente. Lo que sí mueve es contenido de "desarme completo" (anuncios) y las fichas que ChatGPT recomienda.
4. **Faltan dos conexiones para medir de verdad**: Search Console (SEO) y los tokens de Meta (Messenger, Instagram, Ads dentro del sistema).

## 6. Qué agentes de marketing quedan creados en la oficina

| Agente | Estado |
|---|---|
| Mercado Libre | Construido (SQL, diario 8:10) |
| Ads (Meta) | Vacante: necesita la cuenta de anuncios conectada al proyecto |
| Redes sociales | Vacante: necesita tokens de Meta |
| SEO / GEO | Vacante: necesita Search Console |

## 7. Finanzas reales (esquema `finance`, alimentado por finance-bot) · noviembre al 25

| Concepto | Monto | Detalle |
|---|---|---|
| Ventas | $7.091.990 | 70 ventas (68 contado, 2 a crédito) |
| Otros ingresos | $197.000 | 4 |
| Gastos | $1.720.962 | 62 |
| Autos comprados | $3.700.000 | 5 autos (quedan en inventario) |
| Dinero disponible | $1.753.908 | banco $365.298 · caja $696.610 · billetera $692.000 |
| Por cobrar | $100.000 | préstamo otorgado |
| Obligación próxima | $150.000 | arriendo patio, vence 5-dic |

Lectura: el negocio vende ~$7 M/mes en caja y la web aporta una fracción; la plata se está yendo a comprar autos (3,7 M en el mes), que es inventario, no gasto. El nuevo escritorio Finanzas lo revisa a diario y avisa si pasan 2 días sin registrar, si vence una obligación en 7 días o si los gastos superan las ventas.
