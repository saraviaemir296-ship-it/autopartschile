# Skills de diseño gráfico integradas (terceros)

Instaladas el 2026-11-03 desde GitHub en `.claude/skills/`. Total: 184 skills.
Cada carpeta tiene su `SKILL.md`. Claude Code las descubre automáticamente en este proyecto.

## Origen, versión y licencia

| Repo | Commit | Licencia | Skills instaladas | Requisitos |
|---|---|---|---|---|
| motiful/product-shots | 063c508 | MIT | `product-shots`, `product-shots-main-image`, `product-shots-detail-page`, `product-shots-multi-angle`, `product-shots-ad-creative`, `product-shots-social-post`, `product-shots-image-gen` | Python 3 + clave de API de imágenes (ver abajo). Paga por imagen |
| social-media-skills/skills | f28cef2 | MIT | 106 skills (brand-profile, voice-builder, content-calendar, reels-script, canva, thumbnail-design, quote-cards-and-text-graphics, nano-banana, etc.) | Ninguno. Solo texto |
| fatihaydost/brand-identity-skill | 850f215 | MIT | `brand-identity` | Python 3.10+, uv, navegador Chromium. Descarga paquetes de PyPI y fuentes de Google Fonts al usarse |
| kingbootoshi/nano-banana-2-skill | 80bab9a | MIT | `nano-banana-cli` (renombrada: el repo la llama `nano-banana`, nombre que ya usa social-media-skills) | Bun, FFmpeg, ImageMagick, `GEMINI_API_KEY`. Paga por imagen |
| charlie947/remove-ai-design-slop | 54498ec | **Sin archivo LICENSE** | `remove-ai-design-slop` | Ninguno. Solo texto |
| designrique/ai-graphic-design-skill | 7d9d03b | MIT | `ai-graphic-design` | Ninguno. Guía en portugués |
| bergside/awesome-design-skills | f631a09 | MIT | 67 skills `design-style-*` (minimal, corporate, flat, bold, editorial, …). Renombradas con prefijo porque los nombres originales (`flat`, `neon`, `basic`) eran ambiguos | Ninguno. Son sistemas de diseño para UI web, no para gráficas |

Advertencia sobre `remove-ai-design-slop`: el repo no declara licencia. Legalmente eso significa "todos los derechos reservados" aunque el README diga "free". Úsala internamente; no la redistribuyas sin pedir permiso al autor.

## Claves de API (nunca en el repo)

Copiar `.env.example` a `.env` fuera de control de versiones, o exportar en la shell.

| Variable | La usa | Dónde se obtiene |
|---|---|---|
| `GEMINI_API_KEY` | `nano-banana-cli`, `product-shots-image-gen` (si se apunta a un gateway compatible) | https://aistudio.google.com/apikey |
| `PRODUCT_SHOTS_IMAGEGEN_BASE_URL` + `PRODUCT_SHOTS_IMAGEGEN_API_KEY` | `product-shots-image-gen` | Cualquier endpoint compatible con el SDK de OpenAI, por ejemplo `https://api.openai.com/v1` con una clave de OpenAI |
| `OMNIMAAS_API_KEY` | `product-shots-image-gen` (backend por defecto del autor) | Gateway de terceros OmniMaaS/Cloubic. **No recomendado**: tus fotos y prompts pasan por un intermediario. Prefiere las variables `PRODUCT_SHOTS_*` apuntando directo a OpenAI o Gemini |

## Costo de contexto

Las 184 descripciones suman unos 117.000 caracteres (~30.000 tokens) que Claude Code intenta cargar en cada conversación. Claude Code tiene un presupuesto de caracteres para el listado de skills (variable `SLASH_COMMAND_TOOL_CHAR_BUDGET`, por defecto 15.000). Con este volumen es probable que una parte de las skills no aparezca en el listado hasta que se suba ese presupuesto o se eliminen carpetas. Para podar: borrar la carpeta de la skill. Las 67 `design-style-*` son las primeras candidatas; para este sitio basta con 2 o 3 (por ejemplo `design-style-corporate`, `design-style-clean`, `design-style-professional`).

## Regla de uso para repuestos usados

Las skills de generación de imágenes (`product-shots-*`, `nano-banana-cli`) pueden "embellecer" la pieza. En una desarmaduría eso es tergiversar el estado del producto. Uso permitido: fondo blanco, recorte, iluminación uniforme, marca de agua. Uso prohibido: regenerar o retocar la pieza misma, borrar desgaste, óxido o daños.

## Revisión de seguridad realizada

Antes de copiar se revisaron los 184 `SKILL.md` y los 67 scripts (Python, TypeScript, shell) buscando descargas ejecutadas por pipe, exfiltración de credenciales, `eval` sobre entrada externa y hosts de red no declarados. No se encontró nada anómalo. Hosts externos reales que contactan los scripts: Google Fonts, Fontshare, PyPI (vía uv), astral.sh (instalador de uv), aistudio.google.com y el gateway de imágenes que tú configures. El script `brand.py check` de brand-identity no se ejecutó en esta sesión (bloqueado por la política de ejecución de código externo); ejecútalo tú la primera vez y revisa qué instala.
