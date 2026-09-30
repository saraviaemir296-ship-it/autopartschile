"""Recorta el fondo blanco de estudio de los retratos del equipo (flood fill
desde los bordes + borde suavizado + descontaminación del halo blanco)."""
import sys, numpy as np
from PIL import Image
from scipy import ndimage as ndi

def cutout(src, dst, thr=232):
    im = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
    mx, mn = im.max(2), im.min(2)
    whiteish = (mn > thr) & ((mx - mn) < 18)
    lab, _ = ndi.label(whiteish)
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bg = np.isin(lab, border[border > 0])
    bg = ndi.binary_opening(bg, iterations=2)
    fg = ~bg
    fg = ndi.binary_fill_holes(fg)
    keep, n = ndi.label(fg)
    if n > 1:  # conserva solo la figura principal
        sizes = ndi.sum(fg, keep, range(1, n + 1))
        fg = keep == (np.argmax(sizes) + 1)
    fg = ndi.binary_erosion(fg, iterations=2)
    alpha = ndi.gaussian_filter(fg.astype(np.float32), 1.2)
    # descontaminar: en el borde, oscurece hacia el color interior
    edge = (alpha > 0.02) & (alpha < 0.98)
    rgb = im.copy()
    rgb[edge] = rgb[edge] * (0.35 + 0.65 * alpha[edge, None])
    out = np.dstack([rgb, alpha * 255]).clip(0, 255).astype(np.uint8)
    Image.fromarray(out, 'RGBA').save(dst)
    ys, xs = np.nonzero(alpha > 0.5)
    print(dst, 'bbox', xs.min(), ys.min(), xs.max(), ys.max(), 'fg%', round(fg.mean() * 100, 1))

U = '/root/.claude/uploads/0ff08e9d-033d-5601-9624-8a53b507c734/'
cutout(U + '10dc0984-image.png', 'public/equipo/operador-1.png')
cutout(U + '399ad411-image.png', 'public/equipo/operador-2.png')
cutout(U + '18e85361-image.jpg', 'public/equipo/dueno.png', thr=160)  # fondo gris claro
