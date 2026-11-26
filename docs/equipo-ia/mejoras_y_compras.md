# Plan de mejoras por rondas y compras útiles · Desarmaduría Saravia (26-nov-2026)

Canaliza todo lo conversado en los chats: oficina IA, caja, inventario, GEO, Diseñador, precio de mercado, WhatsApp, anuncios, empleados. Cada ronda se apoya en la anterior. Nada aquí tiene números inventados: donde no hay dato, se dice.

## Cómo queda la operación simple (para empleados)

- **/admin/hoy.html** es la única pantalla que necesita un empleado. Cinco listas en lenguaje simple: responder a clientes (botón WhatsApp + Listo), publicar hoy (copiar texto, abrir imagen, marcar publicada), sacar fotos (las piezas más valiosas sin foto, con botón Abrir ficha), buscar número de parte, despachar. Sin IA a la vista: la IA está detrás.
- **/admin/equipo-ia.html** (Centro de Mando) es del jefe: aprobaciones, caja, mente maestra, oficina. La cola bajó de 365 a 28 porque se sacaron de ahí los precios de piezas que no están activas en la web.
- Hoy solo existe tu cuenta de administrador. Para que un empleado entre a "Hoy" hay que crearle usuario y agregarlo a la tabla `admins`, y eso le da acceso a todo el admin. Ronda 2: rol "empleado" con permisos acotados (ver abajo).

## Ronda 1 · esta semana, sin gastar (destraba todo lo que ya está construido)

1. Cargar en Supabase → Edge Functions → Secrets: `ANTHROPIC_API_KEY`, los 3 de Meta (`META_APP_SECRET`, `META_PAGE_ACCESS_TOKEN`, `META_VERIFY_TOKEN`) y los 4 de WhatsApp (`WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`). Con eso corren solos: Seguimiento, Estratega, Messenger/Instagram al CRM, y el bot de WhatsApp.
2. WhatsApp: decidir entre coexistencia (app + API con el mismo número) o número nuevo para la API. La tarea `activar_bot_whatsapp` tiene los pasos.
3. Tocar "Activar avisos" en el Centro de Mando desde tu celular (hoy nadie recibe las notificaciones).
4. Pedir a Mercado Libre el permiso de búsqueda para la app (hoy responde "forbidden"); sin eso no hay precio de mercado automático.
5. Fotos: 927 piezas disponibles no tienen foto. Meta realista: 30 fotos por empleado por día desde "Hoy → Sacar fotos", partiendo por las más caras. En un mes son 600.
6. Número de parte: 615 piezas sin OEM. Misma rutina: 20 por día desde "Hoy → Buscar número de parte".
7. Cargar el costo de compra de los 21 autos antiguos (hoy solo 7 lo tienen): sin eso no se sabe qué desarme rinde.
8. Revisar las 8 ventas de caja con dos candidatos y las 4 consultas "sin stock" que quedaron para ti.

## Ronda 2 · próximas 2 a 3 semanas

1. **Rol "empleado"**: usuarios con acceso solo a "Hoy", Diseñador y fichas de producto (fotos, N° de parte, ubicación), sin ver caja, precios de costo ni aprobaciones. Se hace con una tabla de roles y políticas RLS; medio día de trabajo.
2. **Ubicación física de cada pieza**: estantes y cajas con código (A1, A2…) y el campo `ubicacion_fisica` lleno al ingresar. Es lo que convierte "¿la tenemos?" en "está en B3" en 10 segundos.
3. **Ingreso de auto en el mismo día**: foto + número de parte + precio sugerido para las 20 piezas de más valor del auto el día que entra. El Ingreso de vehículo ya genera la lista; falta la rutina humana.
4. **Anuncios con destino WhatsApp** y solo "desarme completo" (dato real: $175–$543 por conversación contra $998–$1.163 en pieza suelta). Pausar piezas sueltas.
5. **Ofertas de lote del mismo auto** (prueba con el Swift K12M gris: 210 piezas, 11 vendidas): reserva 24 h y foto real en 1 hora. Tú fijas precio y descuento.
6. **Conciliación caja ↔ web diaria** en el Cierre del día: ventas de la web que no estén en la caja y ventas de caja que no bajaron stock. Ya existen las piezas; falta mostrarlas juntas en el cierre.
7. **Contenido de desarmes en Instagram**: cada auto que entra = 1 reel de 20 segundos "llegó un X, qué piezas hay". Es lo que más conversaciones trae por peso; cuesta cero.

## Ronda 3 · 1 a 2 meses

1. **Recepcionista con IA en WhatsApp**: con la clave de Anthropic, el bot entiende mensajes libres ("tengo un swift 2015 y me falla la bomba de bencina"), extrae marca/modelo/año/pieza y cotiza solo cuando el precio está fijado. Hoy responde lo informativo y deriva el resto.
2. **Compatibilidad por patente**: el cliente manda la patente y el sistema saca marca/modelo/año (hay servicios chilenos de consulta de patente; hay que contratar uno). Reduce el 50 % de las preguntas.
3. **Red de desarmadurías** (solicitudes #ID entre desarmadurías): ya está diseñado; falta elegir la fuente (grupo de WhatsApp / formulario).
4. **Importación OEM guiada por demanda sin stock**: la lista "lo que piden y no hay" alimenta el próximo pedido a India. El agente Importaciones ya la arma.
5. **Tiempo de respuesta medido**: con WhatsApp en el CRM se mide cuánto tarda cada respuesta; meta: menos de 15 minutos en horario.
6. **Grúas Saravia dentro de la misma oficina**: hoy vive en otro proyecto; unificar leads y caja.

## Ronda 4 · 3 a 6 meses

1. **Precio por antigüedad**: a los 60 y 90 días en stock, el sistema propone bajar el precio (tú apruebas). Hoy hay 223 piezas con más de 60 días ($28,1 M a precio de venta).
2. **Programa de referidos y clientes recurrentes**: talleres y mecánicos que compran seguido; lista propia (Dan Kennedy: la lista es el activo).
3. **Clientes B2B (talleres)**: precio mayorista con mínimo de compra; es la vía de volumen que la web no da.
4. **Exportación**: ya vendiste 2 cajas de cambio a Bolivia ($600.000). Medir cuántas consultas vienen de fuera de Chile antes de invertir.
5. **Margen real por desarme**: costo del auto + horas de desarme + ventas; decide qué autos comprar. Depende de la ronda 1 (costos cargados).

## Compras útiles (verifica precios; no los invento)

| Compra | Para qué | Cuándo |
|---|---|---|
| Celular dedicado a WhatsApp Business / API | Que el número no dependa del teléfono personal; coexistencia API + app | Ronda 1 |
| Caja de luz (o fondo blanco plegable) + 2 luces LED + trípode | Fotos uniformes de piezas; es lo que hoy falta en 927 piezas y lo que ML y Marketplace premian | Ronda 1 |
| Impresora térmica de etiquetas + rollos | Etiqueta con SKU y QR en cada pieza y en cada estante; el celular lee el QR y abre la ficha | Ronda 2 |
| Estanterías con cajas numeradas | La ubicación física por pieza; sin esto el campo `ubicacion_fisica` no sirve | Ronda 2 |
| Balanza de plataforma (hasta 100 kg) | Peso real para cotizar Starken/Chilexpress antes de que el cliente pague | Ronda 2 |
| Lector OBD2 y tester de batería/alternador | Probar piezas eléctricas con video antes de entregar (tu propia política de garantía) | Ronda 2 |
| Material de embalaje (film, cartón, esquineros) | Menos devoluciones por daño en envío | Ronda 2 |
| Impresora común | Guías de despacho y órdenes de retiro | Ronda 2 |
| Crédito de API de Anthropic | Es el combustible de Seguimiento, Estratega y el bot con IA; sin él no razonan | Ronda 1 |
| Servicio de consulta de patente (API) | Compatibilidad automática por patente | Ronda 3 |

## Lo que NO comprar todavía

- Más autos hasta recuperar el costo de los 7 cargados ($4.400.000; recuperado registrado 0).
- Software de gestión aparte: todo ya vive en una base; comprar otro sistema desparrama de nuevo.
- Anuncios de piezas sueltas.
