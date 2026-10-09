"""Ficha de desarme con el diseño de Desarmaduría Saravia.

Uso:  python3 ficha.py fichas.json
fichas.json = [{"foto": "fotos/x.jpg", "anios": "2006-2015",
                "lineas": ["SUZUKI SX4 CROSSOVER 1.6", "m16a VVT 4x4 AUTOMÁTICO", "INTEGRAL SIN FALLAS"],
                "foco": 0.5, "salida": "salida/x.jpg"}]
"foco" (0 = arriba, 1 = abajo) elige qué parte de la foto queda en el recorte.
"""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont, ImageEnhance, ImageOps

AQUI = os.path.dirname(os.path.abspath(__file__))
P = lambda *x: os.path.join(AQUI, *x)
W, H = 1179, 2096
FOTO_Y0, FOTO_Y1 = 540, 1557          # zona de la foto (entre encabezado y pie)
FONT = P('plantilla', 'anton.woff')
ROJO = (225, 6, 6)

def fuente(px): return ImageFont.truetype(FONT, px)

def ajustar(draw, txt, max_w, px):
    while px > 30 and draw.textlength(txt, font=fuente(px)) > max_w: px -= 2
    return fuente(px)

def ficha(foto, anios, lineas, salida, foco=0.5):
    lienzo = Image.new('RGB', (W, H), 'white')
    # foto: recorte "cover" en la zona central, con un toque de contraste y color
    im = ImageOps.exif_transpose(Image.open(P(foto))).convert('RGB')
    zw, zh = W, FOTO_Y1 - FOTO_Y0
    s = max(zw / im.width, zh / im.height)
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    x0 = (im.width - zw) // 2
    y0 = round((im.height - zh) * foco)
    im = im.crop((x0, y0, x0 + zw, y0 + zh))
    im = ImageEnhance.Contrast(im).enhance(1.06)
    im = ImageEnhance.Color(im).enhance(1.08)
    lienzo.paste(im, (0, FOTO_Y0))
    lienzo.paste(Image.open(P('plantilla', 'encabezado.png')).convert('RGB'), (0, 0))
    lienzo.paste(Image.open(P('plantilla', 'pie.png')).convert('RGB'), (0, FOTO_Y1))
    d = ImageDraw.Draw(lienzo)
    # bloque izquierdo: DESARME (blanco) + años (rojo)
    d.rectangle((6, 545, 405, 705), fill='white')
    d.rectangle((6, 705, 405, 815), fill=ROJO)
    f = ajustar(d, 'DESARME', 330, 120)
    d.text((205, 627), 'DESARME', font=f, fill='black', anchor='mm')
    f = ajustar(d, anios, 340, 96)
    d.text((205, 760), anios, font=f, fill=(255, 225, 228), anchor='mm')
    # bloque derecho: cada línea con su caja negra (efecto escalera)
    lineas = [l for l in lineas if l][:3]
    px = min(ajustar(d, l, 690, 92).size for l in lineas)
    f = fuente(px)
    y = 545
    alto = 108
    for l in lineas:
        tw = d.textlength(l, font=f)
        d.rectangle((425, y, min(1175, 425 + 30 + tw + 30), y + alto), fill='black')
        d.text((455, y + alto / 2 + 2), l, font=f, fill='white', anchor='lm')
        y += alto
    os.makedirs(os.path.dirname(P(salida)), exist_ok=True)
    lienzo.save(P(salida), quality=93)
    return P(salida)

if __name__ == '__main__':
    for it in json.load(open(sys.argv[1])):
        print(ficha(it['foto'], it['anios'], it['lineas'], it['salida'], it.get('foco', 0.5)))
