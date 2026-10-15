#!/bin/bash
# AI Vird Programi promo kaydi 09 (gercek Samsung telefon 1080x2340, Play release, prod). Beat isaretleri stdout'a yazilir.
#
# Prerequisites: `export ANDROID_SERIAL=<serial>`, telefon acik/kilitsiz, Rahatsiz Etme acik, uygulama Premium Google
# hesabiyla giris yapmis (>=3 AI kredisi). Kurulum/geri alma ayrintilari: record-ai-chat-05.sh basligi. Metin girisi: ADBKeyBoard kuruluysa onunla
# (adb shell ime enable+set com.android.adbkeyboard/.AdbIME); degilse panoya yazip yapistirma (keyevent 279) denenir,
# o da calismazsa script durur ("ı" icin `input text` calismaz). Script ekrani deep link ile acar: zikirmatik://vird/ai-create.
# Bu script 3 AI kredisi harcar. Cikti: public/recordings/ai-vird-09.mp4 + ai-vird-09-cfr.mp4 (60fps).
#
# ACTIVATE (varsayilan KAPALI): ACTIVATE=1 verilmezse "Programi Baslat"a ASLA basilmaz; onizlemede kayit biter ve
# program taslak kalir (aktif program degismez). ACTIVATE=1 prod hesabin aktif programini degistirir, dikkat.
#
# Form varsayilanlari (use-vird-ai-generate.ts): sure 7 gun, dilim yalniz "Sabah". Sure secenekleri SADECE 7/14/30 gun
# (21 yok) -> 30 gun secilir. Sabah zaten secili oldugu icin DOKUNULMAZ (dokunmak kapatir); yalniz "Akşam" eklenir.
set -e
: "${ANDROID_SERIAL:?export ANDROID_SERIAL=<serial from adb devices>}"
export LC_ALL=en_US.UTF-8
a() { adb "$@"; }
[ "$(a shell wm size | tail -1 | awk '{print $NF}')" = 1080x2340 ] || { echo "wm size 1080x2340 degil"; exit 2; }
S="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/public/recordings"
DUMP="${DUMP:-/tmp/ai-vird-09-final.xml}"
T0=$(date +%s.%N)
mark() { printf '%s %.2f\n' "$1" "$(echo "$(date +%s.%N) - $T0" | bc)"; }
TEXT="sabır"
ui() { a shell "uiautomator dump /sdcard/u.xml >/dev/null; cat /sdcard/u.xml" 2>/dev/null || true; }
stop_rec() { a shell pkill -INT screenrecord || true; wait $REC || true; }
# Dump'ta etikete (text) veya testID'ye (resource-id) gore ogenin merkezine dokun; yoksa kaydi durdurup cik.
tap_node() {
  local B X Y
  B=$(echo "$(ui)" | grep -o "\(text\|resource-id\)=\"$1\"[^>]*bounds=\"\[[0-9]*,[0-9]*\]\[[0-9]*,[0-9]*\]\"" | head -1 | grep -o '\[[0-9]*,[0-9]*\]\[[0-9]*,[0-9]*\]')
  [ -n "$B" ] || { echo "NOT FOUND: $1"; stop_rec; exit 2; }
  X=$(echo "$B" | sed -E 's/\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]/\1 \3/' | awk '{print int(($1+$2)/2)}')
  Y=$(echo "$B" | sed -E 's/\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]/\2 \4/' | awk '{print int(($1+$2)/2)}')
  a shell input tap "$X" "$Y"
}

a shell cmd statusbar collapse
a shell am start -a android.intent.action.VIEW -d "zikirmatik://vird/ai-create" com.zikirmatik_asistan.app >/dev/null
sleep 3
a shell "screenrecord --bit-rate 16000000 --time-limit 180 /sdcard/aivird09.mp4" &
REC=$!
T0=$(date +%s.%N)
sleep 1.5; mark start
tap_node e2e-vird-ai-free-text           # niyet alani
sleep 0.8
if a shell pm list packages | grep -q com.android.adbkeyboard; then
  a shell ime enable com.android.adbkeyboard/.AdbIME >/dev/null; a shell ime set com.android.adbkeyboard/.AdbIME >/dev/null
  for ((i = 0; i < ${#TEXT}; i++)); do
    a shell am broadcast -a ADB_INPUT_B64 --es msg "$(printf '%s' "${TEXT:i:1}" | base64)" >/dev/null
    sleep 0.15
  done
else   # ADBKeyBoard yok: panoya yaz + yapistir (279); dump'ta dogrulanir
  a shell cmd clipboard set-text "$TEXT" >/dev/null 2>&1 || true
  a shell input keyevent 279
  sleep 0.5
  ui | grep -q "text=\"$TEXT\"" || { echo "TEXT MISMATCH (ADBKeyBoard kur: adb install ADBKeyboard.apk)"; stop_rec; exit 2; }
fi
mark typed
sleep 0.6
a shell input keyevent 4                 # klavyeyi kapat
sleep 1.0
tap_node "30 gün"; mark duration         # 21 secenegi yok (7/14/30)
sleep 1.0
tap_node "Akşam"; mark slots             # Sabah varsayilan secili
sleep 1.5
tap_node e2e-vird-ai-submit; mark submit
WAIT0=$(date +%s); READY=0
while [ $(( $(date +%s) - WAIT0 )) -lt 60 ]; do
  UI=$(ui)
  if echo "$UI" | grep -q 'text="PROGRAM"'; then READY=1; break; fi  # start butonu ekran disinda, dump'ta yok
  if echo "$UI" | grep -q 'Asistan şu anda meşgul\|Program oluşturulamadı\|Konu dışı'; then break; fi
  sleep 0.7
done
echo "$UI" > "$DUMP"
if [ "$READY" != 1 ]; then mark timeout; stop_rec; exit 1; fi
mark preview
sleep 2
a shell input swipe 540 1700 540 900 1800  # onizlemeyi yavasca kaydir
mark scrolled
sleep 2
if [ "${ACTIVATE:-0}" = 1 ]; then
  tap_node e2e-vird-ai-start; mark activated   # preview'da buton ekran disinda kalirsa tap_node basarisiz olur
  sleep 3
fi
mark end
stop_rec
sleep 2
a pull /sdcard/aivird09.mp4 "$S/ai-vird-09.mp4" >/dev/null
ffmpeg -y -v error -i "$S/ai-vird-09.mp4" -vf "fps=60,tpad=stop_mode=clone:stop_duration=1" -an -c:v libx264 -crf 16 -preset medium -pix_fmt yuv420p "$S/ai-vird-09-cfr.mp4"
ffprobe -v error -show_entries stream=width,height,r_frame_rate,nb_frames -show_entries format=duration -of default=nw=1 "$S/ai-vird-09-cfr.mp4"
