# Reel Grúas Saravia · Rescate Suzuki SX4 + capa SALVI

**Formato:** 9:16 · 1080×1920 · 30 fps · **33,5 s**
**Idea central:** no es "tenemos una grúa", sino "cuando tienes un problema con tu vehículo, alguien se hace cargo".
**Estructura:** PERSONAS (tú a cámara) → OPERACIÓN (material real) → TECNOLOGÍA (SALVI) → PERSONAS (cierre) → número.

Borrador renderizado con tu material real: `remotion/out/reel-sx4-borrador.mp4` (los planos a cámara aparecen como marcadores "FALTA GRABAR").

---

## 0. Análisis del material (antes de montar)

| Archivo | Duración | Qué muestra | Audio | Uso |
|---|---|---|---|---|
| **IMG_3232** | 16,0 s · 1440×1920 (3:4) | Recorrido de cámara alrededor del SX4 estacionado. Desde el s 6 aparece la grúa al fondo con la plataforma inclinada y la rampa en el suelo. Gran angular (0,5×). | Ambiente. Los primeros 3,5 s tienen un ruido fuerte y agudo (viento o sistema hidráulico): **escúchalo antes de usarlo**. | Llegada (03,0–05,0) y primer plano lateral del auto (06,2–07,0) |
| **IMG_3239** | 7,3 s · 1080×1920 | Trasera de la grúa: **winche visible** en el centro de la cabina, plataforma y rampa abajo, SX4 en primer plano. Look más cálido y saturado que 3232/3240. | Ambiente bajo | Winche (05,0–06,2) y detalle tecnológico (20,3–21,6) |
| **IMG_3240** | 11,0 s · 1440×1920 (3:4) | SX4 **ya sobre la plataforma inclinada**, rampas abajo; la cámara hace un arco desde el lateral hasta la parte trasera y vuelve. Es el plano más "cinematográfico" que tienes. | **Sin audio** (silencio total) | Rescate (07,0–13,0) y detalle de rueda (19,0–20,3) |
| **IMG_3244** | 4,3 s · 1080×1920 | SX4 cargado, plano bajo con pasto en primer plano: **ya tiene paralaje real** (el pasto se mueve más rápido que la grúa). Look cálido. | Ambiente | Plano cinematográfico (13,0–19,0), portada, detalle (21,6–22,9) |
| Logo | PNG 1774×887 | Logo con fondo negro | — | CTA final |

### Qué falta (y no se puede resolver bien con edición)

1. **No hay ninguna toma tuya hablando a cámara.** El gancho (0–3 s) y el cierre (26–31 s) son justamente lo que hace que esto parezca una historia real y no una publicidad. Sin eso el Reel no funciona como lo pediste. Hay que grabarlos (guía en la sección 4).
2. **No hay una toma del auto subiendo en movimiento.** En IMG_3240 el SX4 ya está sobre la plataforma y lo que se mueve es la cámara. El speed ramp va a acelerar **el movimiento de cámara**, no el auto. Funciona, pero no digas "mira cómo sube" en ningún texto.
3. **No hay primeros planos** de winche, gancho, eslingas, luces ni neumático. Los "detalles" de la sección tecnológica son recortes digitales (zoom de 130–140 %) de planos abiertos: en un celular se ven bien durante 1,3 s, pero no más.
4. **La baliza es ámbar y aparece apagada** en todos los planos. No agregues un destello rojo falso: se nota y contradice el "realista" que pediste. El sonido de baliza lo dejé fuera por la misma razón.
5. **No hay fotografías**, solo videos. No hizo falta simular un parallax 3D: IMG_3244 ya tiene profundidad real y se ve mejor que cualquier efecto 2.5D.

### Dos puntos que tienes que confirmar antes de publicar

- **"Nos llamaron por un Suzuki SX4."** En el sitio de la desarmaduría hay una página de repuestos de un *Suzuki SX4 Hatchback*. Si este SX4 es un auto que iba al desarme y no el llamado de un cliente, esa frase es falsa. En ese caso usa **"Traslado de un Suzuki SX4."** (se cambia en `callText` en `ReelSX4.tsx`).
- **SALVI.** "Cotización rápida", "Ubicación en tiempo real" y "Seguimiento del servicio" son **promesas**. Si hoy un cliente no puede recibir un link de seguimiento, esto es publicidad engañosa (Ley 19.496, art. 28) y, peor para el negocio, el primer cliente que lo pida y no lo reciba te va a desmentir en los comentarios. Si SALVI todavía está en desarrollo, deja el rótulo **"SALVI · VISTA ILUSTRATIVA"** que ya trae el mapa y cambia los textos a futuro ("Estamos construyendo…") o sácalos.

---

## 1. Guion final

| Tiempo | Imagen | Voz (tú) | Texto en pantalla |
|---|---|---|---|
| 00:00–03:00 | Tú a cámara, plano medio-corto | "Cuando alguien queda botado, no tiene tiempo para esperar." | Subtítulos dinámicos |
| 03:00–07:00 | Llegada: grúa con la rampa abajo, winche, SX4 | — (ambiente + música) | "Nos llamaron por un Suzuki SX4." (pequeño) |
| 07:00–13:00 | SX4 sobre la plataforma, arco de cámara con speed ramp | — | "RESCATE + TRASLADO SEGURO" → "Sin complicaciones." |
| 13:00–19:00 | Plano bajo, SX4 cargado, push-in lento | — | "Desde el primer contacto" → "hasta la entrega." |
| 19:00–22:90 | Detalles: rueda / winche / auto fijado | — | Callouts anclados: "Cotización rápida." · "Ubicación en tiempo real." · "Seguimiento del servicio." |
| 22:90–25:90 | Mapa SALVI + tarjeta de estado | — | SERVICIO EN CURSO · ETA CALCULADA · SALVI • SERVICIO ACTIVO |
| 25:90–30:90 | Tú a cámara | "Si algún día necesitas una grúa, quiero que tengas un número guardado antes de necesitarlo." | Subtítulos, resaltado "UN NÚMERO GUARDADO" |
| 30:90–33:50 | Pantalla final | — | Logo · Asistencia vehicular 24/7 · +56 9 5381 7335 · **Guárdalo ahora.** |

## 2. Voz

**Prioridad absoluta: tu voz.** Solo hablas en dos momentos (≈ 8 s en total). Todo lo demás lo cuentan la imagen, la música y el sonido. Eso es lo que hace que no parezca comercial.

- **Hook (≈ 3 s):** "Cuando alguien queda botado, no tiene tiempo para esperar." Dilo como si se lo explicaras a un amigo. Una pausa mínima después de "botado". Termina firme en "esperar", sin subir el tono.
- **Cierre (≈ 5 s):** "Si algún día necesitas una grúa, quiero que tengas un número guardado antes de necesitarlo." Más lento que el hook. Mira al lente en "número guardado". No sonrías de forma forzada.

**Voz en off de respaldo** (solo si tu audio es inutilizable): voz masculina chilena, 25–35 años, tono conversacional y bajo. En ElevenLabs: *Stability 45 %, Similarity 75 %, Style 10 %*. Mi recomendación honesta es que no la uses: una voz sintética sobre tu cara destruye el "esto es real".

**Limpieza de audio (CapCut):** seleccionar clip → *Audio* → **Reducir ruido: ON** → *Mejorar voz: ON* (en desktop) → volumen de la voz con picos cerca de −6 dB. En desktop o en Audacity/Adobe Podcast: filtro pasa altos a 80 Hz (quita el viento), +2 dB en 3 kHz para inteligibilidad, compresor 3:1, normalizar a **−14 LUFS** en la exportación completa.

## 3. Timeline completo 00:00–00:33,5 (segundo a segundo)

| Timecode | Clip (archivo · tramo original) | Vel. | Zoom | Texto / gráfico | SFX | Música |
|---|---|---|---|---|---|---|
| 00:00,0 | **HOOK** (grabar) | 100 % | 100→104 % lento | "CUANDO ALGUIEN **QUEDA BOTADO,**" | Room tone | Solo pad grave a −30 dB |
| 00:01,1 | ↳ | | | "**NO TIENE TIEMPO**" | | |
| 00:02,0 | ↳ | | | "PARA **ESPERAR.**" | | |
| 00:03,0 | **IMG_3232** · 07,0–09,0 | 100 % | 100→106 % | "Nos llamaron por un Suzuki SX4." (entra 00:03,2) | **Impacto grave** justo en el corte + motor diésel en ralentí | **Entra el beat** |
| 00:05,0 | **IMG_3239** · 03,1–04,3 (winche) | 100 % | 108→114 % | (sigue el texto) | Clic metálico + cadena del winche | |
| 00:06,2 | **IMG_3232** · 00,2–01,0 (lateral del SX4) | 100 % | 110→104 % | sale el texto en 06,8 | Roce suave | |
| 00:07,0 | **IMG_3240** · 04,8–05,8 | 100 % | 105 % → | "RESCATE + / TRASLADO SEGURO" (entra 07,4) | Impacto mecánico en el corte | Golpe de la batería |
| 00:08,0 | **IMG_3240** · 05,8–07,4 | **160 %** | → | | Whoosh grave muy corto | |
| 00:09,0 | **IMG_3240** · 07,4–08,8 | **70 %** (flujo óptico) | →116 % | sale el titular en 10,6 | Winche tensando (loop suave) | |
| 00:11,0 | **IMG_3240** · 09,4–10,8 | 70 % | 102→108 % | "Sin complicaciones." (entra 11,2) | Golpe de la plataforma asentándose | Baja un poco la intensidad |
| 00:13,0 | **IMG_3244** · 00,3–04,2 | **65 %** (flujo óptico) | 100→114 % + desplazamiento lateral de −28 px | "Desde el primer contacto" (13,4–16,0) | Ambiente de calle, pájaros bajos | Tensión sostenida |
| 00:16,2 | ↳ | | | "hasta la entrega." (16,2–18,9) | | |
| 00:19,0 | **IMG_3240** · 01,0–02,3 (rueda + plataforma) | 100 % | 140→148 % | Callout "Cotización rápida." | "Blip" digital suave | Cambio: la música se vuelve más electrónica |
| 00:20,3 | **IMG_3239** · 03,3–04,6 (winche) | 100 % | 135→142 % | Callout "Ubicación en tiempo real." | Blip | |
| 00:21,6 | **IMG_3244** · 01,6–02,9 | 100 % | 130→136 % | Callout "Seguimiento del servicio." + tarjeta "Suzuki SX4 · Fijado a plataforma" | Blip | |
| 00:22,9 | **mapa-salvi.mp4** (render) | — | — | Ruta roja, A "Ubicación del vehículo", B "Destino", SERVICIO EN CURSO, ETA CALCULADA | Pulso digital + tic por cada pin | |
| 00:24,2 | ↳ | | | Entra la tarjeta "SALVI • SERVICIO ACTIVO" (3 estados en cascada) | 3 ticks suaves | |
| 00:25,9 | **CIERRE** (grabar) | 100 % | 100→104 % | "SI ALGÚN DÍA NECESITAS UNA GRÚA," | Corte seco | **La música baja a solo pad** (voz protagonista) |
| 00:27,2 | ↳ | | | "QUIERO QUE TENGAS" | | |
| 00:28,1 | ↳ | | | "**UN NÚMERO GUARDADO**" | | |
| 00:29,4 | ↳ | | | "ANTES DE NECESITARLO." | | |
| 00:30,9 | **cta-final.mp4** (render) | — | — | Logo → "Asistencia vehicular 24/7" → +56 9 5381 7335 → **Guárdalo ahora.** → Guárdalo como "Grúa Saravia" | Impacto suave + cola de reverb | Acorde de resolución |
| 00:33,5 | FIN | | | | | Corte de la cola de reverb |

## 4. Lista de clips

**Del material que ya tienes** (todos se usan):
- IMG_3232 → 07,0–09,0 · 00,2–01,0
- IMG_3239 → 03,1–04,3 · 03,3–04,6
- IMG_3240 → 04,8–08,8 · 09,4–10,8 · 01,0–02,3
- IMG_3244 → 00,3–04,2 · 01,6–02,9

**Renders de Remotion** (en `remotion/out/`):
- `mapa-salvi.mp4` (3 s) · `cta-final.mp4` (3 s, usa 2,6 s) · `salvi-overlay.mov` (tarjeta con fondo transparente, ProRes 4444) · `portada.png`

**Lo que tienes que grabar (obligatorio):**

| Toma | Cómo |
|---|---|
| **HOOK.MOV** | Plano medio-corto (del pecho hacia arriba), a la altura de los ojos. Cámara trasera en **1×** (el 0,5× deforma la cara). 1080p o 4K a 30 fps. De fondo, la grúa desenfocada (tú a 2–3 m de ella). Luz de día nublado o sombra abierta, sin sol directo en la cara. Micrófono de solapa (DJI Mic / Rode Wireless) o el celular a menos de 1 m. **Empieza a hablar desde el primer fotograma**: el editor corta el silencio, pero si hablas de inmediato la toma se siente más natural. Graba 5 tomas. |
| **CIERRE.MOV** | Mismo encuadre y luz, pero un poco más cerrado (plano corto). Más lento y tranquilo. 5 tomas. |

**Recomendado para el próximo servicio** (esto sube mucho la calidad):
auto subiendo por la rampa (trípode fijo, **60 fps** para cámara lenta real) · gancho del winche enganchando (primer plano) · trinquete o eslinga apretando la rueda · baliza encendida al atardecer · mano marcando el número o recibiendo el link de SALVI en el teléfono (si existe).

## 5. Texto exacto de cada overlay

| # | Texto | Estilo |
|---|---|---|
| 1 | Nos llamaron por un Suzuki SX4. | Inter 600 · 42 px · barra roja a la izquierda · abajo a la izquierda (y = 1340) |
| 2 | RESCATE + / TRASLADO SEGURO | Archivo 800 · 64 px · mayúsculas · tracking +3 % · "+" blanco al 55 % |
| 3 | Sin complicaciones. | Archivo 600 · 76 px · frase normal · entra con desenfoque → nítido |
| 4 | Desde el primer contacto | Archivo 600 · 62 px |
| 5 | hasta la entrega. | Archivo 800 · 72 px |
| 6 | Cotización rápida. | Callout (punto rojo + línea + cápsula oscura) · Inter 600 · 38 px |
| 7 | Ubicación en tiempo real. | Callout anclado al winche |
| 8 | Seguimiento del servicio. | Callout |
| 9 | VEHÍCULO · Suzuki SX4 · ● Fijado a plataforma | Tarjeta (no "asegurado": en Chile se entiende como "con seguro") |
| 10 | SERVICIO EN CURSO | Píldora mono · punto rojo que respira |
| 11 | A Ubicación del vehículo · B Destino | Pines del mapa |
| 12 | ETA · CALCULADA | Tarjeta con barra de progreso (sin minutos inventados) |
| 13 | SALVI • SERVICIO ACTIVO / Vehículo localizado / Grúa asignada / Traslado en curso / SEGUIMIENTO ACTIVO | Bottom sheet |
| 14 | SALVI · VISTA ILUSTRATIVA | Mono 20 px, blanco al 45 % (déjalo mientras SALVI no esté operativo) |
| 15 | Asistencia vehicular 24/7 · +56 9 5381 7335 · Guárdalo ahora. · Guárdalo como "Grúa Saravia" | CTA |

## 6. Subtítulos (máx. 4–6 palabras por línea; **negrita** = rojo #D10B0C)

```
HOOK
00:00,0  CUANDO ALGUIEN **QUEDA BOTADO,**
00:01,1  **NO TIENE TIEMPO**
00:02,0  PARA **ESPERAR.**

CIERRE
00:25,9  SI ALGÚN DÍA NECESITAS UNA GRÚA,
00:27,2  QUIERO QUE TENGAS
00:28,1  **UN NÚMERO GUARDADO**
00:29,4  ANTES DE NECESITARLO.
```
Posición: y ≈ 1180 px (sobre el tercio inferior y por encima de la zona de botones de Reels). Aparición palabra por palabra (resorte corto). Los tiempos son estimados: ajústalos a tu toma real.

## 7. Música

**Primero, lo práctico:** si la cuenta de Instagram es de **empresa**, Meta solo te deja usar su biblioteca libre de derechos (Meta Sound Collection). Una canción de moda puesta en CapCut y exportada puede quedar silenciada o bloquear el alcance. Usa música con licencia comercial:
- **CapCut → Sonidos → filtro "Uso comercial"**
- **Meta Sound Collection** (gratis)
- **Artlist / Epidemic Sound** (pago, mejor calidad)

**Qué buscar:** `cinematic tech`, `minimal electronic tension`, `automotive documentary`, `dark pulse`, 90–110 BPM, sin voz, con un golpe claro y un final resuelto. Estilo de referencia: bandas sonoras de lanzamientos de producto (una pulsación electrónica más un pad), no trailers épicos.

**Forma de la mezcla:**
- 0–3 s: solo un pad o drone grave a −30 dB (la voz manda).
- 3,0 s: entra la pulsación junto con el impacto del corte.
- 7–19 s: sube la tensión; en 9 s coincide con la cámara lenta.
- 19–26 s: textura más electrónica (tecnología).
- 25,9 s: **se va todo menos el pad**, porque tu voz tiene que escucharse limpia.
- 30,9 s: acorde de resolución más impacto; fundido de 0,4 s al final.
- Música bajo la voz: −20 a −24 dB (en CapCut, entre el 12 % y el 18 % del volumen). Sin voz: entre −14 y −16 dB.

## 8. Diseño sonoro

| t | Sonido | Nivel | Fuente |
|---|---|---|---|
| 00:00 | Room tone del lugar donde grabes | −35 dB | tu grabación |
| 00:03,0 | **Impacto grave** ("sub hit") | −10 dB | CapCut: "impact", "hit" |
| 00:03,0–07,0 | Motor diésel en ralentí + audio ambiente real de IMG_3232/3239 | −24 dB | CapCut "diesel idle" |
| 00:05,0 | Clic metálico / cadena | −18 dB | "metal clank", "chain" |
| 00:07,0 | Impacto mecánico | −12 dB | "mechanical hit" |
| 00:08,0 | Whoosh grave de 0,3 s (el speed ramp) | −20 dB | "whoosh low" |
| 00:09,0–11,0 | Winche tensando (motor eléctrico) | −22 dB | "winch", "electric motor" |
| 00:11,0 | Golpe sordo de la plataforma | −16 dB | "heavy thud" |
| 00:13,0–19,0 | Ambiente de barrio + pájaros | −28 dB | "suburban ambience" |
| 00:19,0 / 20,3 / 21,6 | "Blip" de interfaz (uno por callout) | −22 dB | "UI blip", "soft click" |
| 00:22,9 | Pulso digital + 2 ticks (pines) | −20 dB | "UI notification soft" |
| 00:24,2 | 3 ticks en cascada (estados de SALVI) | −24 dB | "UI tick" |
| 00:30,9 | Impacto suave + cola de reverb | −14 dB | "cinematic hit soft" |

**Sin sonido de baliza** mientras la baliza no aparezca encendida en pantalla. IMG_3240 no tiene audio: esos 6 s dependen de la música, el winche y el whoosh.

## 9. Instrucciones exactas para CapCut

**Proyecto:** Nuevo proyecto → Formato **9:16** → Fondo negro → resolución de exportación **1080p, 30 fps, velocidad de bits "Alta"**.
**Orden de pistas:** V1 = video · V2 = superposiciones (mapa, CTA, SALVI) · T = textos · A1 = voz · A2 = música · A3 = SFX.

> **Atajo recomendado:** importa `reel-sx4-borrador.mp4` como referencia en una pista silenciada y bloqueada, y monta encima. O, mejor todavía: graba HOOK y CIERRE, pásalos a `remotion/public/talking-head/` y vuelve a renderizar el Reel completo desde Remotion (sección 10). Así CapCut solo se usa para música y SFX.

**Clip por clip** (T = timecode en la línea de tiempo del Reel):

**01 · HOOK**
- T 00:00,0–03,0 · CLIP: HOOK.MOV (tu mejor toma) · CORTE: quitar todo el silencio antes de la primera sílaba
- VELOCIDAD: 100 % · ZOOM: fotograma clave en Escala: 100 % → 104 % (inicio → fin)
- TRANSICIÓN de salida: **ninguna (corte seco)** · TEXTO: subtítulos de la sección 6 (Texto → Subtítulos automáticos, luego corregir y dividir en 3 líneas)
- EFECTO: ninguno · SFX: room tone · MÚSICA: pad a −30 dB · Voz: Reducir ruido ON

**02 · Llegada**
- T 03,0–05,0 · CLIP: IMG_3232, recortar de 07,0 a 09,0 · VELOCIDAD 100 %
- ZOOM: fotogramas clave 100 % → 106 % con el ancla a la derecha (hacia la grúa)
- TRANSICIÓN: corte seco sincronizado con el impacto · TEXTO: "Nos llamaron por un Suzuki SX4." (Inter semibold, 42, abajo a la izquierda, animación de entrada "Deslizar a la derecha", 0,4 s, **sin rebote**), duración 03,2–06,8
- SFX: impacto grave en 03,0 + motor · MÚSICA: entra el beat · Volumen del clip: 35 %

**03 · Winche**
- T 05,0–06,2 · CLIP: IMG_3239, de 03,1 a 04,3 · VELOCIDAD 100 % · ZOOM 108 % → 114 % (centro en el winche)
- AJUSTE: bajar saturación −18 y temperatura −6 (este clip viene más cálido) · TRANSICIÓN: corte seco · SFX: clic metálico

**04 · Lateral del SX4**
- T 06,2–07,0 · CLIP: IMG_3232, de 00,2 a 01,0 · VELOCIDAD 100 % · ZOOM 110 % → 104 % (se abre) · corte seco
- Nota: el audio de este tramo tiene ruido fuerte: **silencia el clip**.

**05 · Rescate: speed ramp**
- T 07,0–11,0 · CLIP: IMG_3240, de 04,8 a 08,8, **dividido en 3**:
  - 5a: 04,8–05,8 → **100 %** (1,0 s)
  - 5b: 05,8–07,4 → **160 %** (1,0 s)
  - 5c: 07,4–08,8 → **70 %**, con **"Cámara lenta suave" / flujo óptico activado** (2,0 s)
  - Alternativa: un solo clip con *Velocidad → Curva → Personalizada*: 1,0× · 1,6× · 0,7×.
- ZOOM continuo: 105 % → 116 % a lo largo de los 3 tramos (ancla en la rueda trasera)
- TEXTO: "RESCATE + / TRASLADO SEGURO" en 2 líneas (Archivo/Montserrat ExtraBold, 64, mayúsculas, espaciado +3), entrada "Desvanecer + subir" de 0,5 s y salida por desvanecimiento, 07,4–10,6
- SFX: impacto mecánico en 07,0 · whoosh grave en 08,0 · winche 09,0–11,0 · TRANSICIÓN: ninguna
- Nota: clip sin audio original.

**06 · Sin complicaciones**
- T 11,0–13,0 · CLIP: IMG_3240, de 09,4 a 10,8 · VELOCIDAD **70 %** + cámara lenta suave · ZOOM 102 % → 108 %
- TEXTO: "Sin complicaciones." (Archivo SemiBold, 76, sin mayúsculas) · animación: **Desenfoque → nítido** 0,5 s, 11,2–13,0
- SFX: golpe sordo en 11,0 · corte seco

**07 · Plano cinematográfico**
- T 13,0–19,0 · CLIP: IMG_3244, de 00,3 a 04,2 · VELOCIDAD **65 %** + cámara lenta suave (dura 6,0 s)
- ZOOM: 100 % → 114 % con fotograma clave de **posición X −28 px, Y +18 px** (push-in con leve deriva lateral; el pasto en primer plano da el paralaje real). Curva: *ease in-out*.
- AJUSTE: saturación −18, temperatura −6 · TEXTO A: "Desde el primer contacto" 13,4–16,0 · TEXTO B: "hasta la entrega." 16,2–18,9 (nunca juntos)
- SFX: ambiente de barrio · TRANSICIÓN de salida: corte seco

**08 · Detalle 1**
- T 19,0–20,3 · IMG_3240 01,0–02,3 · 100 % · ZOOM 140 % → 148 % (encuadre: rueda trasera + chevrones rojos)
- TEXTO: callout "Cotización rápida." → importa o recrea: punto rojo sobre el auto, línea blanca de 2 px y cápsula oscura (negro al 72 %, radio 14). Entrada: punto (0,25 s) → línea (0,4 s) → cápsula (0,4 s). *Seguimiento* (tracking) de CapCut sobre el punto si quieres que se quede pegado.
- SFX: blip

**09 · Detalle 2**
- T 20,3–21,6 · IMG_3239 03,3–04,6 · 100 % · ZOOM 135 % → 142 % (winche) · ajuste de color como el 03
- TEXTO: callout "Ubicación en tiempo real." anclado al winche · SFX: blip

**10 · Detalle 3**
- T 21,6–22,9 · IMG_3244 01,6–02,9 · 100 % · ZOOM 130 % → 136 %
- TEXTO: callout "Seguimiento del servicio." + tarjeta "VEHÍCULO · Suzuki SX4 · ● Fijado a plataforma" arriba a la izquierda · SFX: blip
- ⚠ No pases de 140 % de zoom en IMG_3239/3244: son 1080 de ancho y se pixelan.

**11 · Mapa SALVI**
- T 22,9–25,9 · CLIP: `mapa-salvi.mp4` completo (ya incluye la tarjeta SALVI desde 24,2) · 100 %
- TRANSICIÓN de entrada: **Desvanecer de 6 fotogramas** (la única transición suave del Reel: marca el cambio de lenguaje visual) · SFX: pulso digital + ticks

**12 · CIERRE**
- T 25,9–30,9 · CLIP: CIERRE.MOV · 100 % (si la toma queda larga, **no la aceleres**: corta respiraciones) · ZOOM 100 % → 104 %
- TEXTO: subtítulos del cierre · MÚSICA: bajar al pad · corte seco de entrada

**13 · CTA**
- T 30,9–33,5 · CLIP: `cta-final.mp4` (recortar a 2,6 s; el número queda en pantalla ≥ 2 s) · corte seco
- SFX: impacto suave · MÚSICA: acorde final + fundido de 0,4 s

**Exportar:** 1080p · 30 fps · Alta · **no subir a 60 fps** (el material es de 30).

## 10. Estructura de animaciones Remotion

Proyecto en `remotion/`. Todo el montaje sale de `src/timeline.ts` (frames a 30 fps) y `src/compositions/ReelSX4.tsx`.

| Composición | Duración | Para qué |
|---|---|---|
| `ReelSX4` | 1005 f (33,5 s) | Reel completo con material real. Props: `hookSrc`, `closeSrc`, `callText`, `etaMinutes` |
| `MapSegment` | 90 f | Mapa + tarjeta SALVI para insertar en CapCut |
| `SALVIOverlay` | 75 f | Solo la tarjeta, **con alfa** (ProRes 4444) |
| `CTAEndCard` | 90 f | Pantalla final |
| `Cover` | still | Portada PNG |

**Paleta:** Rojo `#D10B0C` (solo acentos: palabras clave, ruta, puntos de estado, subrayado del CTA) · Negro `#0A0A0A` (fondos de interfaz; el CTA usa `#000` para fundirse con el PNG del logo) · Blanco `#FFFFFF`. Derivados: blanco al 62 % (texto secundario), blanco al 14 % (bordes), negro al 72 % con desenfoque de 12–18 px (vidrio).
**Easing:** `ease.out` = bezier(0.16, 1, 0.3, 1) para entradas · `ease.in` = bezier(0.7, 0, 0.84, 0) para salidas · `ease.inOut` = bezier(0.65, 0, 0.35, 1) para cámara y ruta · resorte suave (damping 200, stiffness 120) para paneles · resorte "pop" (damping 16–20, stiffness 200) solo para palabras y puntos.
**Zona segura:** 250 px arriba, 420 px abajo, 72 px a los lados.

| # | Componente | Propósito | Diseño | Animación · entrada / salida | Duración | Posición | Tipografía |
|---|---|---|---|---|---|---|---|
| 1 | **AnimatedMap** | Demostrar el concepto SALVI | Mapa vectorial propio: manzanas `#121212`, calles `#262626`, avenida diagonal, parques verdes muy oscuros. Degradados arriba y abajo | Entra con fundido en 14 f; la cámara hace un push-in de 1,12 a 1,04 con deriva; al entrar la tarjeta, el mapa sube 170 px. Sale con fundido en 8 f | 90 f | Pantalla completa | — |
| 2 | **RouteLine** | Ruta A→B | Trazo rojo de 10 px, halo rojo desenfocado y base blanca al 10 % | `strokeDashoffset` de 0→1 entre los f 6–34, `ease.inOut` | Dentro del mapa | Recorrido en L por la cuadrícula | — |
| 3 | **TowTruckMarker** | Grúa en movimiento | Círculo negro con borde blanco y una grúa plataforma dibujada (cabina blanca, plataforma roja, baliza ámbar, igual que la real); flecha de dirección que gira | Avanza por la ruta del 2 % al 62 % entre los f 18–84, `ease.inOut`. El ícono no rota: solo la flecha | f 16–90 | Sobre la ruta | — |
| 4 | **ServiceStatus** | Estado del servicio | Píldora de vidrio con un punto rojo que "respira" | Baja 16 px con fundido en 14 f | Todo el mapa | Arriba al centro (y = 270) | JetBrains Mono 700 · 28 · tracking 0,14 em |
| 5 | **ETAIndicator** | ETA sin datos inventados | Tarjeta de vidrio: "ETA" y "CALCULADA" (o "18 min" si pasas `minutes` con un dato real), más una barra de progreso roja | Sube 16 px en 16 f; la barra se llena entre los f 8–60 | Todo el mapa | Arriba a la izquierda (y = 380) | Mono 22 + Archivo 800 · 42/64 |
| 6 | **SALVIInterface** | Tecnología + control + tranquilidad | Bottom sheet de 900 px: título, 3 estados con check rojo, pie "SEGUIMIENTO ACTIVO". Sin nombres, patentes, precios ni horas | Resorte desde +60 px; estados en cascada cada 9 f (pop); el pie aparece en el f 38; sale con fundido en 10 f | 50–75 f | Abajo al centro (padding inferior de 440) | Mono 700 · 26 · Inter 500 · 36 |
| 7 | **LocationPin** | A = vehículo, B = destino | A: anillo blanco con núcleo negro y pulso · B: cuadrado rojo con núcleo blanco. Etiqueta en cápsula oscura | Pop con resorte (damping 14); la etiqueta se desliza 12 px con 6 f de retraso | — | A (250, 1330) · B (860, 560) | Inter 600 · 30 + letra en mono |
| 8 | **VehicleCard** | Contexto del auto real | Tarjeta de vidrio con barra roja: VEHÍCULO / Suzuki SX4 / ● Fijado a plataforma | Sube 14 px en 14 f; sale con fundido en 8 f | 39 f | Arriba a la izquierda (72, 300) | Mono 20 · Archivo 800 · 38 · Inter 500 · 26 |
| 9 | **LogoAnimation** | Entrada del logo real | El PNG original (sin redibujar), con `mix-blend-mode: screen` para eliminar el fondo negro | Revelado con máscara de izquierda a derecha en 20 f, escala de 1,04 a 1, barrido de luz entre los f 16–40 y deriva de −6 px. Nada vuela | 90 f | Centro, arriba (y ≈ 420) | — |
| 10 | **CTAFinal** | Que guarden el número | Negro puro con un brillo rojo muy tenue; logo → claim → número → CTA → "Guárdalo como 'Grúa Saravia'" | Escalonado: 14 / 22 / 36 / 56 f; subrayado rojo con `scaleX` entre los f 44–60 | 78–90 f | Centrado; el número en y ≈ 1100 | Inter 500 · 40 · **JetBrains Mono 700 · 84** · Archivo 800 · 64 |
| + | **SceneCallout** | Textos "integrados en la escena" | Punto rojo con anillo, línea guía y cápsula de vidrio | Punto (8 f), línea (4–16 f), cápsula (12–24 f); deriva con el zoom del clip | 39 f | Anclado al elemento | Inter 600 · 38 |
| + | **Caption / Headline / Kicker** | Subtítulos y títulos | — | Palabra por palabra con resorte; títulos que entran de desenfocado a nítido | — | y 1180–1340 | Archivo / Inter |
| + | **Clip** | Material real | Speed ramp por tramos, zoom y paneo continuos, corrección de color con CSS, viñeta y scrim inferior | — | — | Pantalla completa | — |

## 11. Código

Todo está en `remotion/src/`:
```
theme.ts            paleta, fuentes locales, easings, zona segura
anim.ts             helpers
timeline.ts         línea de tiempo maestra
components/         AnimatedMap, RouteLine, TowTruckMarker, ServiceStatus, ETAIndicator,
                    SALVIInterface, LocationPin, VehicleCard, LogoAnimation, CTAFinal,
                    SceneCallout, Caption (Caption/Headline/Kicker), Footage (Clip), TalkingHead
compositions/       ReelSX4.tsx, Standalone.tsx (MapSegment, SALVIOverlay, CTAEndCard, Cover)
```
**Uso:**
```bash
cd reels/gruas-saravia-sx4/remotion
npm install
bash prep-footage.sh ~/Videos/IMG_3232.MOV ~/Videos/IMG_3239.MOV ~/Videos/IMG_3240.MOV ~/Videos/IMG_3244.MOV
bash prep-footage.sh ~/Videos/HOOK.MOV ~/Videos/CIERRE.MOV      # cuando los grabes
npm run studio          # previsualizar y ajustar tiempos de subtítulos
npm run render:all      # reel + mapa + overlay SALVI + CTA + portada → out/
```
Para usar tus tomas a cámara, en `src/compositions/ReelSX4.tsx` → `reelDefaults`: `hookSrc: 'talking-head/HOOK.mp4'` y `closeSrc: 'talking-head/CIERRE.mp4'`. Si la toma tiene silencio al inicio, usa la prop `startFrom` de `TalkingHead`.
El video no se sube al repositorio (`.gitignore`): los originales pesan 60 MB y **el sitio se publica desde la raíz del repo**, así que todo lo que se suba aquí queda público en autopartschile.cl/reels/…

## 12. Prompts para elementos que faltan

Casi todo se resuelve con material real o con Remotion. **No generes con IA la grúa, el SX4 ni a ti**: sería justo lo que pediste evitar, y la gente lo nota.

- **Maqueta de SALVI en un teléfono** (solo si SALVI existe y quieres mostrarlo en un celular real; mejor aún, graba la pantalla real):
  `Vertical photo, hand holding a black iPhone in a car's driver seat, overcast daylight, shallow depth of field, screen replaced with solid green (#00FF00) for compositing, realistic, Chilean suburban street visible through windshield, muted colors, no logos` → reemplaza el verde por `salvi-overlay.mov` en CapCut (Croma).
- **Textura de fondo para el CTA** (opcional): `Subtle dark asphalt texture, top-down, almost black (#0A0A0A), very fine grain, soft vignette, no objects, no text, 1080x1920`.
- **Música generada** (solo si no encuentras nada con licencia): `Minimal cinematic electronic, 96 BPM, dark pulse bass, soft analog pad, tension builds for 20 seconds then drops to pad only, ends on a warm resolving chord, no vocals, premium automotive documentary, 34 seconds`.
- **Íconos** (si quieres más callouts): `Minimal line icon set, 2px stroke, white on transparent: tow truck flatbed side view, map pin, stopwatch, route, checkmark shield. Consistent geometric style, no fill, SVG`.

## 13. Corrección de color (CapCut → Ajustar)

| Parámetro | IMG_3232 / 3240 (neutros) | IMG_3239 / 3244 (cálidos) | Tomas a cámara |
|---|---|---|---|
| Brillo | −3 | −5 | 0 |
| Contraste | +12 | +8 | +6 |
| Saturación | −6 | **−18** | −4 |
| Temperatura | 0 | **−6** | según la piel |
| Luces altas | −15 (el cielo nublado está al límite) | −12 | −8 |
| Sombras | −8 | −6 | −4 |
| Nitidez | +8 | +6 | +4 |
| Viñeta | +12 | +12 | +8 |
| **HSL rojo** | Saturación +8, luminancia −3 (resalta la plataforma) | Saturación +4 | **No tocar** (afecta la piel) |
| HSL naranja | 0 | −6 (ámbar de la baliza y fachadas) | 0 |

El SX4 es negro: **no le subas el contraste en las sombras ni cambies el matiz**, porque se vería azul o verde. Aplica el mismo ajuste a los clips de cada columna (copiar y pegar atributos) para que los cortes no "salten".

## 14. Tipografía

| Uso | Fuente | Alternativa en CapCut |
|---|---|---|
| Titulares, subtítulos, CTA | **Archivo** 600/800 (Google Fonts, OFL) | Montserrat ExtraBold |
| Texto de apoyo, callouts | **Inter** 500/600 | "Sistema" / SF Pro |
| Datos de interfaz, número, estados | **JetBrains Mono** 500/700 | Roboto Mono |

CapCut permite importar fuentes (Texto → Fuente → Importar). Los archivos están en `remotion/public/fonts/`. Usa un máximo de 3 pesos en todo el Reel.

## 15. Portada

`remotion/out/portada.png`: fotograma real de IMG_3244 (SX4 cargado) con **"Si hoy quedas botado, / ¿a quién llamas?"** en el cielo, dentro del recorte 3:4 que usa el perfil de Instagram. Es una pregunta que el hook responde, así que el perfil invita a tocar. En Instagram: Editar portada → Agregar desde el carrete → recorte 3:4 centrado.

## 16. Copy para Instagram

> Cuando quedas botado no necesitas publicidad. Necesitas a alguien que conteste y se haga cargo.
>
> Este fue un Suzuki SX4: carga en plataforma, fijación y traslado sin complicaciones.
>
> 📲 +56 9 5381 7335 — guárdalo como **"Grúa Saravia"**. Cuando lo necesites vas a buscar "grúa", no nuestro nombre.
>
> Asistencia vehicular 24/7.
>
> #grúa #grúas #asistenciaenruta #remolque #grúaplataforma #chile #[tuciudad]

(Reemplaza `#[tuciudad]` por la comuna o ciudad donde operas: el hashtag local vale más que 10 genéricos. Si SALVI ya funciona, agrega: "Y con SALVI sigues tu servicio en tiempo real.")

**Comentario fijado:** "📲 +56 9 5381 7335 · 24/7 · Guárdalo hoy, agradécelo después."

## 17. CTA

- **En el video:** "Guárdalo ahora." + "Guárdalo como 'Grúa Saravia'".
- **Por qué el "guárdalo como":** "Guárdalo ahora" pide una acción; decir *cómo* guardarlo elimina la fricción y hace que te encuentren cuando lo necesiten. Nadie que está botado a las 2 AM se acuerda de un apellido; busca "grúa".
- **En la bio:** enlace directo a WhatsApp (`wa.me/56953817335`) y, si puedes, una tarjeta vCard descargable (un toque = contacto guardado).

## 18. Cinco hooks alternativos (para testear contra el original)

1. **"Si hoy quedas botado, ¿a quién llamas?"** — Segunda persona y una pregunta. Obliga a pensar en una respuesta que la persona no tiene. Es el más fuerte según mi criterio.
2. **"Nadie guarda el número de una grúa… hasta que la necesita."** — Nombra el problema real que resuelve el Reel (el número guardado) y conecta directo con el cierre.
3. **"Así se ve un rescate cuando alguien se hace cargo."** — Promete mostrar algo. Funciona si el primer plano es la grúa y no tu cara.
4. **"Quedar botado no es el problema. El problema es no saber a quién llamar."** — Reencuadre. Es más largo (≈ 4 s), así que úsalo solo si lo dices rápido.
5. **"Este Suzuki SX4 no partió. Esto fue lo que hicimos."** — Específico y narrativo. **Úsalo solo si es verdad** que el auto estaba en panne.

**Crítica honesta del hook original:** "Cuando alguien queda botado…" está en tercera persona, así que el espectador lo escucha como algo que le pasa a otro. Los hooks 1 y 2 le hablan a él. Publica el original y, 5–7 días después, el hook 1 con el mismo montaje. Compara la **retención a los 3 s** y los **guardados**, no los likes.

---

## Riesgos y decisiones que no deberías pasar por alto

1. **Sin tomas a cámara no hay Reel.** El montaje de la operación (3–26 s) ya funciona. El 30 % restante depende de 10 minutos de grabación que todavía no existen.
2. **Duración:** 33,5 s está dentro de lo que pediste, pero el bloque tecnológico (19–26 s) es donde más gente se va a ir. Si la retención cae ahí, prueba una versión de 26 s sin los 3 callouts (solo mapa + SALVI).
3. **Promesas de SALVI:** ver sección 0. Mostrar algo que no existe es la forma más rápida de perder la confianza que este video intenta construir.
4. **Patentes:** se leen la patente de la grúa (tuya, OK) y parcialmente la de un Ford EcoSport estacionado (de un tercero). Si quieres ser prolijo, desenfócala en la portada.
5. **El 0,5×:** todo el material está grabado en gran angular. Las casas se curvan en los bordes. No uses "corrección de lente" (recorta más y resta resolución); en su lugar mantén el auto en el centro, donde la distorsión es mínima. Para las próximas grabaciones, usa **1×** en los detalles y 0,5× solo en planos abiertos.
