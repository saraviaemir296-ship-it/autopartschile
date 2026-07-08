"""
Genera los bloques de HTML de las tarjetas de "Vehiculos en Desarme"
a partir de data/vehiculos.json (fuente de verdad).

Uso cuando se agrega un vehiculo nuevo:
1. Agregar un objeto nuevo al FINAL de la lista en data/vehiculos.json
   (id, tipo, nombre, alt, img, periodo, wa, cta).
2. Subir la foto correspondiente a img/catalog/ (mismo estandar: ~480-800px
   ancho, JPEG calidad ~80-82).
3. Ejecutar: python generate_vehiculos.py
4. Copiar el primer bloque impreso dentro de <div class="desarmes-grid" ...>
   en index.html (reemplaza el bloque de tarjetas existente).
5. Copiar el segundo bloque impreso dentro de <div class="desarmes-grid" ...>
   en vehiculos-en-desarme.html (reemplaza el bloque de tarjetas existente).
6. Commit y push.

Esto evita escribir HTML a mano cada vez -> menos riesgo de romper el sitio.
"""
import json

HOME_MAX = 8  # cuantos se muestran en la portada (los mas recientes)

CARD_TMPL = """<div class="desarme-card">
<div class="dcard-img-wrap"><img src="{img}" alt="{alt}" loading="lazy" width="320" height="330"></div>
<div class="dcard-info">
<h3>{nombre}</h3>
<span class="dcard-year">{periodo}</span>
<a href="https://wa.me/56953817335?text={wa}" class="dcard-btn" target="_blank" rel="noopener">&#128172; {cta}</a>
</div>
</div>"""


def render(vehiculos):
    return "\n\n".join(CARD_TMPL.format(**v) for v in vehiculos)


def main():
    with open("data/vehiculos.json", encoding="utf-8") as f:
        vehiculos = json.load(f)

    home_items = vehiculos[-HOME_MAX:][::-1] if len(vehiculos) > HOME_MAX else vehiculos
    full_items = vehiculos[::-1]  # mas recientes primero

    print("=== BLOQUE PARA index.html (destacados, max %d, mas recientes primero) ===\n" % HOME_MAX)
    print(render(home_items))
    print("\n\n=== BLOQUE PARA vehiculos-en-desarme.html (catalogo completo, mas recientes primero) ===\n")
    print(render(full_items))


if __name__ == "__main__":
    main()
