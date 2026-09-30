"""Corta la voz en off (un MP3 con 4 frases separadas por pausas) en 4 archivos,
normalizados a -16 LUFS y a 48 kHz, en public/audio/vo/. Uso:
    python3 scripts/prep_vo.py /ruta/voz.mp3
Imprime las duraciones y el JSON de props para renderizar ReelV4 con voz."""
import json, re, subprocess, sys
src = sys.argv[1]
out = 'public/audio/vo'
subprocess.run(['mkdir', '-p', out])
log = subprocess.run(['ffmpeg', '-hide_banner', '-i', src, '-af', 'silencedetect=n=-38dB:d=0.35', '-f', 'null', '-'],
                     capture_output=True, text=True).stderr
dur = float(re.search(r'Duration: (\d+):(\d+):([\d.]+)', log).groups()[2]) + 60 * int(re.search(r'Duration: (\d+):(\d+)', log).group(2))
starts = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', log)]
ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', log)]
gaps = sorted([(e - s, s, e) for s, e in zip(starts, ends) if s > 0.2 and e < dur - 0.2], reverse=True)[:3]
cuts = sorted((s + e) / 2 for _, s, e in gaps)
bounds = [0.0] + cuts + [dur]
names = ['hook', 'software', 'geo', 'close']
props = {}
for i, name in enumerate(names):
    a, b = bounds[i], bounds[i + 1]
    f = f'{out}/vo_{name}.wav'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-ss', f'{a:.3f}', '-to', f'{b:.3f}',
                    '-af', 'silenceremove=start_periods=1:start_threshold=-40dB,areverse,silenceremove=start_periods=1:start_threshold=-40dB,areverse,'
                           'highpass=f=80,acompressor=threshold=-18dB:ratio=3:attack=5:release=80,loudnorm=I=-16:TP=-1.5:LRA=7',
                    '-ar', '48000', '-ac', '2', f], check=True)
    d = float(re.search(r'Duration: \d+:\d+:([\d.]+)', subprocess.run(['ffmpeg', '-hide_banner', '-i', f], capture_output=True, text=True).stderr).group(1))
    print(f'{name:9s} {a:6.2f}–{b:6.2f}s  → {f} ({d:.2f}s)')
    props[name] = f'audio/vo/vo_{name}.wav'
print(json.dumps({'vo': props, 'music': 'audio/music_v4.wav', 'place': 'SANTIAGO, CHILE'}))
