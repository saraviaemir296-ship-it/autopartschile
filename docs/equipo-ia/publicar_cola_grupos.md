# Publicación automática en grupos de Facebook (cola + agente en el Chrome de Emir)

## Qué hace Emir
1. En **Hoy** (`/admin/hoy.html`), en la tarjeta de la pieza, toca **✅ Aprobar: el agente publica en todos los grupos**.
   Queda en cola la misma publicación para **todos** los grupos de ese modelo a los que Emir pertenece (ej. un ECU de Alto 800: los 4 grupos de Alto + los 4 de Suzuki). La primera línea del texto cambia en cada grupo.
2. Nada más. El agente publica.

## Quién publica y por qué así
Facebook no tiene API para publicar en grupos. Un robot en un servidor con la sesión de Emir viola las reglas de Facebook y arriesga la cuenta (que es un canal de ventas); la skill `publicar-en-grupos-facebook` lo prohíbe. Por eso publica **Claude en el Chrome real de Emir**, que es su sesión y su navegador: Emir no copia ni pega nada, pero el PC tiene que estar encendido con Chrome y la extensión de Claude.

## Prompt para Claude en Chrome (pegar una vez por tanda, o dejarlo como tarea programada en Claude Desktop)
> Publica la cola de grupos: abre https://autopartschile.cl/admin/grupos-cola.html (sesión de Emir), abre "Instrucciones para el agente" y síguelas en bucle hasta que la cola diga vacía o tope diario. Publica cada una con el método de la skill publicar-en-grupos-facebook (sección 5), uno por uno, y marca el resultado en la página después de cada grupo. Si Facebook avisa un límite, marca "Facebook avisó límite" y detente.

## Reglas que aplica la cola (BD)
- `grupos_aprobar_publicacion(producto)`: encola todos los grupos compatibles (sin el tope de 6), salvo los que ya tienen esa pieza en los últimos 7 días; los grupos que solo tienen "Vender algo" quedan como Marketplace.
- `grupos_cola_siguiente()`: entrega uno a la vez, espera 60-120 s entre publicaciones, respeta el tope diario `crm_settings.grupos_max_dia` (15) y la pausa de 24 h si Facebook avisó.
- `grupos_cola_resultado(id, estado, detalle, link)`: publicado / pendiente del admin / no se pudo / saltado / Facebook avisó límite (pausa y aviso al celular). Guarda el link real del grupo la primera vez.
- Todo queda en `grupos_publicaciones` (registro) y en la tabla de la página.
