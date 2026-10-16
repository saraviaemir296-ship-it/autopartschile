#!/usr/bin/env bash
# Reproduce GRUAS-SARAVIA-LOGO-3D-FINAL.mp4 desde cero.
# Requisitos: bpy (Blender como módulo de Python, en un venv con numpy<2) y ffmpeg.
# Uso: ./build_final.sh <python_con_bpy> <carpeta_trabajo> <carpeta_sfx (remotion/public/audio)>
set -euo pipefail
PY=$1; W=$2; A=$3; HERE=$(cd "$(dirname "$0")" && pwd)
mkdir -p "$W/ff"
# 1) Render 3D (Cycles): cuadros 1–151 animados; 152–216 son cámara y luces quietas,
#    así que el cierre es el cuadro 151 repetido (cierre perfectamente estable, sin parpadeo).
"$PY" "$HERE/scene_final.py" "$HERE/logo_bezier.json" "$W/ff" 100 24 range:1-151
for i in $(seq 152 216); do cp "$W/ff/f_0151.png" "$W/ff/$(printf 'f_%04d.png' "$i")"; done
# 2) Audio: grave de ambiente + whoosh + detalle mecánico breve + impacto controlado con cola
ffmpeg -v error -y \
 -f lavfi -t 9 -i "anoisesrc=color=brown:amplitude=0.5:sample_rate=48000" \
 -f lavfi -t 9 -i "sine=frequency=46:sample_rate=48000" \
 -f lavfi -t 9 -i "sine=frequency=92.5:sample_rate=48000" \
 -f lavfi -t 9 -i "sine=frequency=138.6:sample_rate=48000" \
 -i "$A/sfx_whoosh.wav" -i "$A/sfx_metal.wav" -i "$A/sfx_click.wav" -i "$A/sfx_impact_soft.wav" -i "$A/sfx_sub.wav" \
 -filter_complex "[0]lowpass=f=320,highpass=f=30,volume=0.5[n];[1]volume=0.2[s1];[2]volume=0.09[s2];[3]volume=0.035[s3];\
[n][s1][s2][s3]amix=inputs=4:normalize=0,tremolo=f=0.25:d=0.2,afade=t=in:d=1.6,afade=t=out:st=7.6:d=1.4[drone];\
[4]lowpass=f=2500,volume=0.28,adelay=1900|1900[wh];\
[5]atrim=0:0.5,afade=t=out:st=0.3:d=0.2,highpass=f=300,volume=0.3,adelay=3950|3950[me];\
[6]volume=0.35,adelay=4550|4550[cl];[7]volume=0.75,adelay=5000|5000[im];[8]volume=0.55,lowpass=f=120,adelay=4980|4980[sb];\
[im][sb]amix=inputs=2:normalize=0,aecho=0.8:0.6:180|360:0.25|0.12[hit];\
[drone][wh][me][cl][hit]amix=inputs=5:normalize=0:duration=first,atrim=0:9,loudnorm=I=-16:TP=-1.5:LRA=8,aresample=48000" -ac 2 "$W/audio_final.wav"
# 3) Video H.264 + audio
ffmpeg -v error -y -framerate 24 -i "$W/ff/f_%04d.png" -i "$W/audio_final.wav" -map 0:v -map 1:a \
 -c:v libx264 -preset slow -crf 14 -pix_fmt yuv420p -c:a aac -b:a 256k -shortest -movflags +faststart "$W/GRUAS-SARAVIA-LOGO-3D-FINAL.mp4"
