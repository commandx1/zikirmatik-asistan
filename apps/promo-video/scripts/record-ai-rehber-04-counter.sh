#!/bin/bash
# AI Rehber promo kaydı 04, sahne 4: Başla -> sayaç (gerçek Samsung telefon). AI çağrısı YAPMAZ (kredi harcamaz).
#
# Prerequisites (bkz. record-ai-rehber-04.sh):
# - Samsung $ANDROID_SERIAL (1080x2340), kilidi açık, Zikirmatik girişli, DND açık.
# - Ana ekran "Serbest Mod", seçili zikir YOK ve serbest sayaç 0 olmalı: aksi halde Başla'ya basınca
#   "Kaydedilmemiş zikir var" (serbest sayaç > 0 veya seçili zikirde kaydedilmemiş ilerleme) ya da
#   "Nasıl devam etmek istersin?" (kart zikri zaten aktif) diyaloğu çıkar (bkz. use-dhikr-start-guard.ts,
#   ai-guide/screen.tsx handleSelectRecommendation). Nötr duruma ana ekranda "Serbest Mod" etiketine
#   (540,345) dokunarak dönülür.
# - AI sekmesinde, geçmiş ("Son Asistan Aramaları") kartından açılmış sonuç görünüyor ve sayfa, take-2'deki
#   'kaynak' karesiyle aynı kadrajda: birincil kartın KAYNAK + "Önerilen hedef: 7" + Başla görünür.
# - Başla (545,831) ve sayaç dokunuş noktası (540,860) 1080x2340 cihaz pikselidir.
set -e
: "${ANDROID_SERIAL:?export ANDROID_SERIAL=<serial from adb devices>}"
a() { adb "$@"; }
S="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/public/recordings"
T0=$(date +%s.%N)
mark() { printf '%s %.2f\n' "$1" "$(echo "$(date +%s.%N) - $T0" | bc)"; }

a shell "screenrecord --bit-rate 16000000 --time-limit 30 /sdcard/ai04c.mp4" &
REC=$!
sleep 1.5; mark start
sleep 1.0
a shell input tap 545 831                # Başla
mark basla
sleep 1.5
for _ in 1 2 3 4 5; do                   # sayaç: 5 dokunuş (hedef 7'ye ulaşma)
  a shell input tap 540 860
  sleep 0.55
done
mark counted
sleep 1.5; mark end
a shell pkill -INT screenrecord || true
wait $REC || true
sleep 2
a pull /sdcard/ai04c.mp4 "$S/ai-rehber-04-counter.mp4" >/dev/null
a shell rm /sdcard/ai04c.mp4
ffprobe -v error -show_entries stream=width,height,r_frame_rate,duration -of csv=p=0 "$S/ai-rehber-04-counter.mp4"
