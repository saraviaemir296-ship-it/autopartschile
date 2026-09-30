#!/usr/bin/env bash
# Convierte los .MOV del iPhone (HEVC, rotados -90°) a MP4 H.264 verticales
# que Chromium/Remotion pueden decodificar. Uso:
#   bash prep-footage.sh /ruta/a/IMG_3232.MOV /ruta/a/IMG_3239.MOV ...
# Las tomas a cámara (hook y cierre) guárdalas como HOOK.MOV y CIERRE.MOV:
# quedarán en public/talking-head/ y reemplazan los placeholders.
set -euo pipefail
mkdir -p public/footage public/talking-head
for f in "$@"; do
  base=$(basename "${f%.*}")
  case "$base" in
    HOOK|CIERRE) dest="public/talking-head/$base.mp4" ;;
    *) dest="public/footage/$base.mp4" ;;
  esac
  ffmpeg -v error -y -i "$f" -vf "scale=-2:1920,format=yuv420p" \
    -c:v libx264 -crf 18 -preset fast -c:a aac -b:a 160k -movflags +faststart "$dest"
  echo "OK → $dest"
done
