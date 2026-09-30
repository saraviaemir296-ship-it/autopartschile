"""Genera SFX y una cama musical mínima de respaldo (48 kHz) de forma
procedural, para cuando no hay acceso a la música/SFX de Krea-ElevenLabs.
Los sonidos físicos (motor, winche, metal) salen del audio real de los clips."""
import numpy as np, wave, os
SR = 48000
out = 'public/audio'
rng = np.random.default_rng(7)

def save(name, x, stereo_width=0.0):
    x = np.asarray(x, dtype=np.float64)
    peak = np.max(np.abs(x)) or 1
    x = x / peak * 0.89
    if stereo_width:
        d = int(SR * 0.012)
        r = np.concatenate([np.zeros(d), x[:-d]])
        l, r = x, (1 - stereo_width) * x + stereo_width * r
    else:
        l = r = x
    st = (np.stack([l, r], 1) * 32767).astype('<i2')
    with wave.open(os.path.join(out, name), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes())

def t(sec): return np.arange(int(SR * sec)) / SR
def lp(x, a):  # one-pole low-pass
    y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x):
        acc += a * (v - acc); y[i] = acc
    return y
def env(n, att, dec):
    a = int(att * SR); e = np.ones(n)
    e[:a] = np.linspace(0, 1, a) if a else 1
    e[a:] = np.exp(-np.arange(n - a) / (dec * SR))
    return e

# Impacto grave: seno con caída de pitch + cuerpo de ruido filtrado
def impact(sec=2.2, f0=90, f1=38, noise=0.35, dec=0.45):
    tt = t(sec); f = f1 + (f0 - f1) * np.exp(-tt * 9)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * env(len(tt), 0.002, dec)
    n = lp(rng.standard_normal(len(tt)), 0.02) * env(len(tt), 0.001, 0.12) * noise
    return np.tanh((body + n) * 1.6)
# Cama musical mínima de respaldo (96 BPM): drone → pulso → pico → pad → acorde
BPM = 96; beat = 60 / BPM; L = 31.2; tt = t(L); n = len(tt)
mix = np.zeros(n)
def seg(a, b): return (tt >= a) & (tt < b)
def fade(a, b, fin=0.5, fout=0.5):
    g = np.clip((tt - a) / fin, 0, 1) * np.clip((b - tt) / fout, 0, 1)
    return g
# drone sub (siempre, muy bajo al inicio)
drone = (np.sin(2*np.pi*41.2*tt) + 0.5*np.sin(2*np.pi*61.7*tt)) * 0.18
mix += drone * (0.35 + 0.65*fade(3.17, 31.2, 0.1, 1.5))
# pad (acorde Am9 suave, filtrado)
pad = sum(np.sin(2*np.pi*f*tt + i) for i, f in enumerate([110, 164.8, 220, 261.6, 329.6, 493.9])) / 6
pad = lp(pad, 0.08) * 0.35
mix += pad * (0.3*fade(0, 3.17, 1.0, 0.2) + 0.9*fade(24.2, 31.2, 0.6, 2.0))
# pulso de bajo en corcheas (3–28 s)
pulse = np.zeros(n)
for k in range(int(3.17/(beat/2)), int(24.2/(beat/2))):
    s0 = int(k*beat/2*SR); m = min(n - s0, int(0.16*SR))
    if m <= 0: continue
    ttt = np.arange(m)/SR
    note = 55 if (k//8) % 2 == 0 else 49
    pulse[s0:s0+m] += np.tanh(2.2*np.sin(2*np.pi*note*ttt)) * np.exp(-ttt*16)
mix += lp(pulse, 0.05) * 0.55 * fade(3.17, 24.2, 0.2, 0.5)
# percusión mínima: kick en negras + hat en corcheas (7–13 y 19–28)
perc = np.zeros(n)
for k in range(0, int(L/(beat/2))):
    tk = k*beat/2; s0 = int(tk*SR)
    active = (10.8 <= tk < 21.8)
    light = (3.17 <= tk < 10.8) or (21.8 <= tk < 24.2)
    if not (active or light): continue
    if k % 2 == 0 and active:
        m = int(0.25*SR); ttt = np.arange(m)/SR
        f = 45 + 80*np.exp(-ttt*30)
        perc[s0:s0+m] += np.sin(2*np.pi*np.cumsum(f)/SR) * np.exp(-ttt*14) * 0.9
    m = int(0.05*SR)
    perc[s0:s0+m] += rng.standard_normal(m) * np.exp(-np.arange(m)/SR*90) * (0.12 if active else 0.08)
mix += perc
# acorde de resolución final (32 s)
tt2 = tt - 28.2
res = sum(np.sin(2*np.pi*f*tt) for f in [130.8, 196, 261.6, 329.6]) / 4 * np.where(tt2 > 0, np.exp(-np.clip(tt2, 0, None)*1.2), 0)
mix += res * 0.5
save('music_v4.wav', np.tanh(mix * 1.2), 0.4)
print('ok')
