#!/bin/bash
# Video 08 "Gunun Esmaul Husnasi": Android emulator QA_Phone (1080x2340), e2e RELEASE apk -> yerel API http://10.0.2.2:3000.
# Onkosullar: emulator acik, yerel API :3000 -> Docker Mongo :27018 (zikir_emu; seed-dhikrs.mjs calismis olmali, yoksa "Zikir bulunamadi"),
#   wm size 1080x2340, demo mode acik. Tek take: A (acilista hos geldin sheet'i) -> B (Basla, sayac) -> C (Esmaul Husna listesi kaydirma).
# SETUP: RKStorage'da 'daily-esma-welcome:*' silinir (sheet yeniden cikar), dhikr-store sifirlanir (kaydedilmemis ilerleme yok).
# Koordinatlar 1080x2340 icin sabit; kayit sirasinda uiautomator/screencap YOK. Cikti: public/recordings/esma-08.mp4 + esma-08-cfr.mp4 (60fps).
set -e
export LC_ALL=en_US.UTF-8
PKG=com.zikirmatik_asistan.app; DB=/data/data/$PKG/databases/RKStorage
S="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/public/recordings"; TMP="${TMPDIR:-/tmp}/esma08"; mkdir -p "$TMP"
BASLA_X=927 BASLA_Y=1314      # sheet'teki ilk 'Basla'
COUNTER_X=539 COUNTER_Y=752   # Basla sonrasi sayac halkasi merkezi
TAPS="${TAPS:-25}"
a() { adb "$@"; }
a root >/dev/null; sleep 2
[ "$(a shell wm size | tail -1 | awk '{print $NF}')" = 1080x2340 ] || { echo "wm size 1080x2340 degil"; exit 2; }
curl -fsS -m 3 localhost:3000/health >/dev/null || { echo "yerel API :3000 yok"; exit 2; }
if [ -z "$NO_SETUP" ]; then
  a shell am force-stop $PKG; sleep 1
  a pull $DB "$TMP/RKStorage" >/dev/null
  sqlite3 "$TMP/RKStorage" "delete from catalystLocalStorage where key like 'daily-esma-welcome:%'"
  python3 - "$TMP/RKStorage" <<'PY'
import sqlite3,json,sys
c=sqlite3.connect(sys.argv[1]); k='dhikr-store-v1'
r=c.execute("select value from catalystLocalStorage where key=?",(k,)).fetchone()
d=json.loads(r[0]); s=d['state']
s.update(items=[],selectedDhikrId=None,freeModeCount=0,freeModeTarget=0,lifetimeCount=0,unsavedProgressDhikrIds=[],unsavedProgressSnapshots={})
c.execute("update catalystLocalStorage set value=? where key=?",(json.dumps(d,ensure_ascii=False),k)); c.commit()
PY
  a push "$TMP/RKStorage" $DB >/dev/null; a shell rm -f $DB-journal
  OWN=$(a shell stat -c %U:%G /data/data/$PKG/databases | tr -d '\r'); a shell chown "$OWN" $DB; a shell restorecon $DB >/dev/null
  a shell input keyevent 3; sleep 2
fi
[ -n "$DRY" ] && exit 0
# --- TAKE ---
a shell "screenrecord --bit-rate 8000000 --time-limit 60 /sdcard/esma08.mp4" & REC=$!
trap '[ -n "$REC" ] && a shell pkill -INT screenrecord >/dev/null 2>&1 || true' EXIT
T0=$(date +%s.%N); mark() { printf '%s %.2f\n' "$1" "$(echo "$(date +%s.%N) - $T0" | bc)"; }
sleep 1.0; mark home_still_start
a shell am start -n $PKG/.MainActivity >/dev/null; mark launch
sleep 5.2; mark sheet_hold_end
a shell input tap $BASLA_X $BASLA_Y; mark basla_tap; sleep 2.0; mark counter_visible
mark first_tap
a shell "i=0; while [ \$i -lt $TAPS ]; do input tap $COUNTER_X $COUNTER_Y; sleep 0.15; i=\$((i+1)); done"
mark last_tap
sleep 1.5; mark scroll_start
for n in 1 2 3; do a shell input swipe 540 2000 540 500 900; sleep 0.7; done; mark scroll_end
sleep 1.0; mark end
a shell pkill -INT screenrecord || true; wait $REC || true; sleep 2; REC=
a pull /sdcard/esma08.mp4 "$S/esma-08.mp4" >/dev/null
ffmpeg -y -v error -i "$S/esma-08.mp4" -vf "fps=60,tpad=stop_mode=clone:stop_duration=1" -an -c:v libx264 -crf 16 -preset medium -pix_fmt yuv420p "$S/esma-08-cfr.mp4"
ffprobe -v error -show_entries stream=width,height,r_frame_rate,nb_frames -show_entries format=duration -of default=nw=1 "$S/esma-08-cfr.mp4"
