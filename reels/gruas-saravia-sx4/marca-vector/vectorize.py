import cv2, numpy as np, json, sys, potrace
src, outdir = sys.argv[1], sys.argv[2]
im = cv2.imread(src)
F = 4
big = cv2.resize(im, None, fx=F, fy=F, interpolation=cv2.INTER_CUBIC)
b, g, r = [big[..., i].astype(np.float32) for i in range(3)]
H, W = big.shape[:2]
masks = {
    'red': np.clip(((r - g) - 50) / 40, 0, 1) * np.clip((r - 110) / 40, 0, 1),
    'white': np.clip((np.minimum(np.minimum(r, g), b) - 140) / 40, 0, 1) * (np.abs(r - g) < 50),
    'grey': ((np.maximum(np.maximum(r, g), b) < 150) & (np.minimum(np.minimum(r, g), b) > 45) & (np.abs(r - g) < 20)).astype(np.float32),
}
import sys as _s
RED_HEX = '#FB0212'
COL = {'grey': '#5E5E60', 'red': RED_HEX, 'white': '#FFFFFF'}
out = {'W': W / F, 'H': H / F, 'layers': {}}
svg_paths = []
for name in ('grey', 'red', 'white'):
    m = masks[name]
    if name == 'grey':
        m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((9, 9), np.uint8))
    m = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 1.6)
    bm = potrace.Bitmap(m <= 0.5)
    plist = bm.trace(turdsize=60 if name != 'grey' else 900, turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY, alphamax=1.0, opticurve=True, opttolerance=0.2)
    curves = []
    d = []
    for c in plist:
        sp = c.start_point
        segs = []
        d.append(f'M{sp.x / F:.2f},{sp.y / F:.2f}')
        for s in c.segments:
            if s.is_corner:
                segs.append(['L', [s.c.x / F, s.c.y / F], [s.end_point.x / F, s.end_point.y / F]])
                d.append(f'L{s.c.x / F:.2f},{s.c.y / F:.2f}L{s.end_point.x / F:.2f},{s.end_point.y / F:.2f}')
            else:
                segs.append(['C', [s.c1.x / F, s.c1.y / F], [s.c2.x / F, s.c2.y / F], [s.end_point.x / F, s.end_point.y / F]])
                d.append(f'C{s.c1.x / F:.2f},{s.c1.y / F:.2f} {s.c2.x / F:.2f},{s.c2.y / F:.2f} {s.end_point.x / F:.2f},{s.end_point.y / F:.2f}')
        d.append('Z')
        curves.append({'start': [sp.x / F, sp.y / F], 'segs': segs})
    out['layers'][name] = curves
    svg_paths.append(f'<path fill="{COL[name]}" fill-rule="evenodd" d="{"".join(d)}"/>')
    print(name, len(curves), 'curvas', sum(len(c["segs"]) for c in curves), 'segmentos')
w, h = W / F, H / F
body = '\n'.join(svg_paths)
open(f'{outdir}/gruas-saravia-logo.svg', 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}" width="{w:.0f}" height="{h:.0f}">\n<rect width="100%" height="100%" fill="#000"/>\n{body}\n</svg>\n')
open(f'{outdir}/gruas-saravia-logo-transparente.svg', 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}" width="{w:.0f}" height="{h:.0f}">\n{body}\n</svg>\n')
json.dump(out, open(f'{outdir}/logo_bezier.json', 'w'))
