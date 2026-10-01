"""Pixela la patente del SX4 en compra/llegada.mp4 siguiéndola cuadro a cuadro
(template matching desde una posición medida a mano en el cuadro 15)."""
import cv2, numpy as np, subprocess
cap = cv2.VideoCapture('public/compra/llegada.mp4'); frames = []
while True:
    ok, f = cap.read()
    if not ok: break
    frames.append(f)
i0 = 15; x, y, w, h = 315, 868, 200, 76
tpl = frames[i0][y:y + h, x:x + w].copy()
boxes = {i0: (x, y)}
for rng in (range(i0 + 1, len(frames)), range(i0 - 1, -1, -1)):
    px, py = x, y; t = tpl.copy()
    for i in rng:
        g = frames[i]; x0 = max(0, px - 120); y0 = max(0, py - 90)
        win = g[y0:min(g.shape[0], py + h + 90), x0:min(g.shape[1], px + w + 120)]
        r = cv2.matchTemplate(win, t, cv2.TM_CCOEFF_NORMED); _, mv, _, ml = cv2.minMaxLoc(r)
        px, py = x0 + ml[0], y0 + ml[1]; boxes[i] = (px, py)
        if mv > 0.55: t = g[py:py + h, px:px + w].copy()
H, W = frames[0].shape[:2]
out = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', '30', '-i', '-',
                        '-c:v', 'libx264', '-crf', '17', '-pix_fmt', 'yuv420p', 'public/compra/llegada_anon.mp4'], stdin=subprocess.PIPE)
for i, f in enumerate(frames):
    bx, by = boxes[i]; pad = 30
    X0, Y0, X1, Y1 = max(0, bx - pad), max(0, by - pad), min(W, bx + w + pad), min(H, by + h + pad)
    roi = f[Y0:Y1, X0:X1]
    small = cv2.resize(roi, (max(1, (X1 - X0) // 20), max(1, (Y1 - Y0) // 20)))
    f[Y0:Y1, X0:X1] = cv2.GaussianBlur(cv2.resize(small, (X1 - X0, Y1 - Y0), interpolation=cv2.INTER_NEAREST), (41, 41), 0)
    out.stdin.write(f.tobytes())
out.stdin.close(); out.wait()
print('ok', len(frames))
