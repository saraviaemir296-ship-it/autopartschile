# Operación: auditoría total, limpieza y recuperación comercial de WhatsApp Business

**Dónde se ejecuta:** en el PC de Emir, con Claude (computer use) sobre WhatsApp Desktop, siguiendo los skills `revisar-whatsapp-business` y `atencion-a-clientes`. Esta sesión en la nube no puede abrir WhatsApp.
**Dónde se registra:** en la base única. Cada chat revisado queda en `wa_auditoria_chats` y actualiza su lead en `crm_conversations` (categoría, negocio, próxima acción, potencial, archivado). El informe final sale de la base, no de la memoria de quien revisó.

## Flujo

1. **Abrir la auditoría**: Centro de Mando → pestaña WhatsApp → "Abrir auditoría" (o RPC `wa_auditoria_abrir()`). Devuelve el número de auditoría. Si ya hay una en curso, devuelve esa.
2. **Revisar chat por chat** en WhatsApp Desktop (recientes, antiguos, archivados, no leídos). Por cada chat, escribir **una línea JSON** en un archivo `wa_auditoria_<fecha>.jsonl` con este esquema:

```json
{"telefono":"+56 9 1234 5678","nombre":"Hugo","negocio":"desarmaduria","categoria":"cotizacion_enviada","resumen":"Pidió foco trasero izq SX4 2012; se le dio precio 70.000 el 14-nov; no respondió","repuesto":"Foco trasero izquierdo","vehiculo":"Suzuki SX4 2012","precio_cotizado":70000,"ultima_interaccion":"2026-11-14","proxima_accion":"Preguntar si sigue interesado; ofrecer foto y retiro","potencial":"medio","archivado":false,"dudoso":false,"notas":""}
```

| Campo | Valores |
|---|---|
| `negocio` | `desarmaduria` · `gruas` · `ambos` · `otro` |
| `categoria` | `lead_caliente` 🔴 · `lead_pendiente` 🟠 · `cotizacion_enviada` 🟡 · `venta_cerrada` 🟢 · `cliente_recurrente` 🔵 · `pago_pendiente` 💰 · `producto_reservado` 📦 · `consulta_sin_concretar` ⚪ · `chat_cerrado` ⚫ |
| `potencial` | `alto` · `medio` · `bajo` · `nulo` |
| `archivado` | `true` solo si se archivó en WhatsApp (criterios de cierre). Nunca archivar con compromiso pendiente. |
| `dudoso` | `true` → no se archiva y queda en "requieren intervención del propietario" |
| `precio_cotizado` | solo si el precio está en el chat; nunca inventado |

3. **Importar** (cada 20–30 chats, no al final): Centro de Mando → WhatsApp → pegar las líneas JSON → "Importar". Idempotente: repetir un teléfono actualiza, no duplica. Lo que hace la importación por cada chat:
   - crea/encuentra el cliente (`crm_resolve_customer`) y la conversación de WhatsApp;
   - fija `categoria_wa`, `negocio`, `potencial_recuperacion`, `precio_cotizado`, pieza y vehículo;
   - traduce la categoría a la etapa del CRM (caliente → intención de compra, cotización → cotización enviada, pago → pago pendiente, cerrado → cerrado) y a la prioridad;
   - programa `next_action_at` (calientes/pagos/reservas: ahora; pendientes/cotizados: mañana; recurrentes: 14 días) → el agente Seguimiento los toma en su próxima corrida horaria;
   - registra la revisión en `agente_tareas` (agente `auditor`, acción `wa_chat_revisado`).
4. **Cerrar la auditoría**: botón "Cerrar auditoría" (o `wa_auditoria_cerrar(id, notas, limites_acceso)`). Genera el informe de 10 puntos desde la base y avisa al celular.

## Reglas que se mantienen (vienen del encargo de Emir)
- Nunca enviar mensajes, eliminar chats, borrar archivos, bloquear contactos ni confirmar pagos sin comprobante.
- Una cotización no es una venta. Un pago sin evidencia no es pago.
- Dudoso → `dudoso: true`, sin archivar.
- Si hay límites de acceso (PIN, chats que no abren), anotarlos en `limites_acceso` al cerrar. No afirmar que se revisó lo que no se abrió.
- Grúas Saravia y Desarmaduría se distinguen con `negocio`.

## Informe ejecutivo (automático, `wa_auditoria_resumen`)
1. Total de conversaciones revisadas · 2. Chats archivados · 3. Leads calientes · 4. Cotizaciones pendientes · 5. Ventas potencialmente recuperables (n y $ cotizados) · 6. Pagos pendientes · 7. Reservas activas · 8. Clientes esperando respuesta · 9. Servicios de grúa pendientes · 10. Conversaciones que requieren intervención del propietario.
Tabla de oportunidades: `v_oportunidades_wa` (nombre, teléfono, producto/servicio, monto, última interacción, próxima acción, potencial), visible en la pestaña WhatsApp del Centro de Mando y usada por el agente Seguimiento.

## Prompt para la sesión en el PC (pegar tal cual)
> Ejecuta la operación "Auditoría total WhatsApp Business — Saravia" siguiendo `docs/equipo-ia/operacion_whatsapp.md` del repo autopartschile y los skills `revisar-whatsapp-business` y `atencion-a-clientes`. Revisa chat por chat (recientes, antiguos, archivados, no leídos). Por cada chat escribe una línea JSON con el esquema del documento en `wa_auditoria_<fecha>.jsonl`. Archiva en WhatsApp solo los chats que cumplan los criterios de cierre; ante la duda marca `dudoso: true` y no archives. No envíes mensajes, no borres nada, no confirmes pagos. Cada 25 chats pega las líneas en Centro de Mando → WhatsApp → Importar. Al terminar, cierra la auditoría desde el panel anotando los límites de acceso que encontraste.


## Actualización 26-nov · el Cerrador trabaja sobre la auditoría
- Al **cerrar la auditoría** (`wa_auditoria_cerrar`), el agente **Cerrador de ventas** corre de inmediato sobre los chats importados (sin esperar 20 h): cotizaciones sin respuesta, leads calientes, reservas y pagos pendientes reciben su mensaje de cierre PROPUESTO en Centro de Mando → Aprobaciones, con botón de WhatsApp. Nada se envía sin el OK de Emir.
- Los chats donde el cliente escribió último aparecen en "Responder a clientes" (botones Tenemos / No tenemos / Faltan datos / Va en conjunto).
- Rango pedido por Emir: **último mes** primero (recientes, no leídos, archivados del mes); lo anterior después.

## Prompt corto para la sesión del PC (Claude Desktop con uso de computador)
> WhatsApp Business ya está abierto. Ejecuta la auditoría de `docs/equipo-ia/operacion_whatsapp.md` (repo autopartschile) con los skills `revisar-whatsapp-business` y `atencion-a-clientes`: revisa chat por chat el último mes (recientes, no leídos y archivados), una línea JSON por chat con el esquema del documento, distingue Desarmaduría de Grúas, archiva solo los cerrados sin compromisos, marca `dudoso` ante la duda. No envíes mensajes ni borres nada. Cada 25 chats pega las líneas en https://autopartschile.cl/admin/equipo-ia.html → pestaña WhatsApp → Importar. Al terminar toca "Cerrar auditoría" y anota los límites de acceso. El Cerrador de ventas propone los mensajes de cierre solo.

## Regla de Emir (26-nov): no mostrar chats ya respondidos
- Un chat va a "esperando respuesta" SOLO si el último mensaje es del cliente y quedó sin contestar. Si el último mensaje es nuestro, no se lista como pendiente de respuesta: se clasifica por su estado comercial (cotización enviada, venta cerrada, cerrado…) y lo toma el Cerrador o Seguimiento, no Emir.
- En el informe, la sección "Clientes esperando respuesta" lleva únicamente esos chats. Todo lo demás va resumido en números, sin detalle chat por chat, salvo leads calientes, pagos pendientes, reservas y dudosos.

## 26-nov · lo ejecuta Claude en el Chrome de Emir (WhatsApp Web)
Página de trabajo: `/admin/wa-auditoria.html` (instrucciones completas, formato, cuadro para importar, lista de ya revisados y botón de cierre). El agente no necesita leer este repo.
Prompt para la extensión de Claude en Chrome:
> Clasifica los chats de WhatsApp: abre https://autopartschile.cl/admin/wa-auditoria.html, sigue "Instrucciones para el agente" con WhatsApp Web en otra pestaña, empezando por el último mes, importa cada 10 a 20 chats y al terminar cierra la auditoría. No envíes mensajes ni borres nada.
Si WhatsApp Web pide QR: Emir lo escanea una vez desde el celular (WhatsApp Business → Dispositivos vinculados).
