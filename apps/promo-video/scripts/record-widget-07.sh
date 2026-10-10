#!/bin/bash
# Widget 07: Android STREAK widget (1080x2340, QA_Phone emulator, e2e RELEASE apk -> yerel API http://10.0.2.2:3000).
# Onkosullar: emulator acik (adb root calisir: google_apis imaji), apk kurulu, "Zikir Serisi" (2x1) widget'i ana ekranda (merkezde),
#   yerel API :3000 -> Docker Mongo :27018 (zikir_emu), ilk acilis turu/bildirim/rozet modallari kapatilmis, wm size 1080x2340, demo mode acik.
# Misafir seri: sunucu degil YEREL (dhikr-store-v1.activeDayKeys). SETUP bunu 12 gun (dun biten) + bugun 0 olarak yeniden yazar.
# Koordinatlar 1080x2340 icin sabit; kayit sirasinda uiautomator/screencap YOK. Cikti: public/recordings/widget-07.mp4 + -cfr.mp4 (60fps).
set -e
export LC_ALL=en_US.UTF-8
PKG=com.zikirmatik_asistan.app; DB=/data/data/$PKG/databases/RKStorage
S="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/public/recordings"; TMP="${TMPDIR:-/tmp}/widget07"; mkdir -p "$TMP"
WIDGET_X=540 WIDGET_Y=920      # widget govdesi (bbox ~309,786 - 770,1055)
COUNTER_X=539 COUNTER_Y=645    # sayac parmak izi dairesi
TAPS="${TAPS:-33}"
a() { adb "$@"; }
a root >/dev/null; sleep 2
[ "$(a shell wm size | tail -1 | awk '{print $NF}')" = 1080x2340 ] || { echo "wm size 1080x2340 degil"; exit 2; }
curl -fsS -m 3 localhost:3000/health >/dev/null || { echo "yerel API :3000 yok"; exit 2; }
# --- SETUP: seriyi sifirla (12 gun, dun biten; bugun 0) ---
if [ -z "$NO_SETUP" ]; then
  a shell am force-stop $PKG; sleep 1
  a pull $DB "$TMP/RKStorage" >/dev/null
  DAYS=$(for i in $(seq 12 -1 1); do printf '"%s",' "$(date -v-${i}d +%F)"; done | sed 's/,$//')
  sqlite3 "$TMP/RKStorage" "insert or replace into catalystLocalStorage(key,value) values('dhikr-store-v1','{\"state\":{\"activeDayKeys\":[$DAYS]},\"version\":5}')"
  a push "$TMP/RKStorage" $DB >/dev/null; a shell rm -f $DB-journal
  OWN=$(a shell stat -c %U:%G /data/data/$PKG/databases | tr -d '\r'); a shell chown "$OWN" $DB; a shell restorecon $DB >/dev/null
  a shell am start -n $PKG/.MainActivity >/dev/null; sleep 8     # acilista syncWidgets calisir
  a shell input keyevent 3; sleep 3
  a exec-out screencap -p > "$TMP/before.png"; echo "setup bitti: $TMP/before.png (widget: 0 serini surdur / 12 gunluk seri olmali)"
fi
[ -n "$DRY" ] && exit 0
# --- TAKE ---
a shell "screenrecord --bit-rate 8000000 --time-limit 40 /sdcard/widget07.mp4" & REC=$!
trap '[ -n "$REC" ] && a shell pkill -INT screenrecord >/dev/null 2>&1 || true' EXIT
T0=$(date +%s.%N); mark() { printf '%s %.2f\n' "$1" "$(echo "$(date +%s.%N) - $T0" | bc)"; }
sleep 0.8; mark home_still_start
sleep 3.2; mark widget_tap
a shell input tap $WIDGET_X $WIDGET_Y; sleep 2.5; mark counter_visible
mark first_tap
a shell "i=0; while [ \$i -lt $TAPS ]; do input tap $COUNTER_X $COUNTER_Y; sleep 0.15; i=\$((i+1)); done"
mark last_tap
sleep 1.8; mark home_press
a shell input keyevent 3; sleep 4.5; mark end
a shell pkill -INT screenrecord || true; wait $REC || true; sleep 2; REC=
a pull /sdcard/widget07.mp4 "$S/widget-07.mp4" >/dev/null
# screenrecord statik ekranda kare uretmez: son kare (widget guncel) tpad ile 4 sn uzatilir
ffmpeg -y -v error -i "$S/widget-07.mp4" -vf "fps=60,tpad=stop_mode=clone:stop_duration=4" -an -c:v libx264 -crf 16 -preset medium -pix_fmt yuv420p "$S/widget-07-cfr.mp4"
ffprobe -v error -show_entries stream=width,height,r_frame_rate,nb_frames -show_entries format=duration -of default=nw=1 "$S/widget-07-cfr.mp4"
