"""Sonidos de dinero sintetizados: caja registradora (ka-ching), moneda y lluvia de monedas."""
import numpy as np, wave
SR = 48000
rng = np.random.default_rng(3)
def save(name, x):
    x = x / (np.max(np.abs(x)) or 1) * 0.89
    st = (np.stack([x, x], 1) * 32767).astype('<i2')
    with wave.open(f'public/audio/{name}', 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes())
def t(s): return np.arange(int(SR * s)) / SR
def bell(f0, dur, dec, parts=((1, 1), (2.76, .5), (5.4, .25), (8.93, .12))):
    tt = t(dur)
    return sum(a * np.sin(2 * np.pi * f0 * m * tt) * np.exp(-tt / (dec / m ** 0.5)) for m, a in parts)
def click(dur=0.03, amp=1):
    n = int(SR * dur); return rng.standard_normal(n) * np.exp(-np.arange(n) / (SR * 0.004)) * amp
# moneda: campanita metálica corta
coin = bell(3100, 0.35, 0.09, ((1, 1), (1.53, .7), (2.4, .45), (3.9, .2))) + np.pad(click(0.02, .6), (0, int(SR * .33)))
save('sfx_coin.wav', coin)
# ka-ching: clic mecánico + cajón + campana doble
L = int(SR * 1.3); x = np.zeros(L)
x[:len(click(.04))] += click(.04, .9)
d = int(SR * .09); x[d:d + len(click(.05))] += click(.05, .7)
b = bell(2093, 1.1, .35) + .7 * bell(2637, 1.1, .3)
s = int(SR * .14); x[s:s + len(b)] += b[:L - s]
save('sfx_kaching.wav', x)
# lluvia de monedas (para contador / pago)
L = int(SR * 1.2); x = np.zeros(L)
for k in range(16):
    s = int(SR * (k * 0.06 + rng.uniform(0, .03))); c = bell(rng.uniform(2600, 3900), .3, rng.uniform(.05, .1)) * rng.uniform(.4, 1)
    x[s:s + len(c)] += c[:L - s]
save('sfx_coins.wav', x)
print('ok')
