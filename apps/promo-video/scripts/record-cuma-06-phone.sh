#!/bin/bash
# Cuma serisi 06, klip B+C: GERCEK Samsung telefon (1080x2340), Play prod uygulama, kullanicinin hesabi.
# Tek yazim: Cuma Gunu Salavat sayaci (HEDEF kadar dokunus). DRY=1 -> kayit yok, yalniz akis + son ekran goruntusu.
# Onkosullar: export ANDROID_SERIAL=<adb devices>; telefon acik/uyanik, uygulama ana sayacta nötr (Serbest Mod, "Hos geldin"/modal yok);
#   DND acik (adb shell cmd notification set_dnd priority; geri: set_dnd off), adb shell svc power stayon usb (geri: svc power stayon false).
# Koordinatlar 1080x2340 icin sabit (uiautomator kayit sirasinda yok). Kart sirasi degisirse CARD_SWIPES'i
# (koleksiyon acilisindan sonra kart basligini ekranin ~y=1600'une getiren 1400px kaydirma sayisi) DRY ile yeniden bul.
# Cikti: public/recordings/cuma-06-BC-phone.mp4 + -cfr.mp4 (60fps). Beat saniyeleri stdout (kayit basindan).
set -e
: "${ANDROID_SERIAL:?export ANDROID_SERIAL=<serial>}"
export LC_ALL=en_US.UTF-8
DHIKR_TITLE="${DHIKR_TITLE:-Cuma Günü Salavat}"; TARGET="${TARGET:-80}"; CARD_SWIPES="${CARD_SWIPES:-3}"
S="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/public/recordings"
a() { adb "$@"; }
T0=$(date +%s.%N); mark() { printf '%s %.2f\n' "$1" "$(echo "$(date +%s.%N) - $T0" | bc)"; }
if [ -z "$DRY" ]; then
  a shell "screenrecord --bit-rate 16000000 --time-limit 170 /sdcard/cuma06-BC-phone.mp4" & REC=$!
fi
trap '[ -n "$REC" ] && a shell pkill -INT screenrecord >/dev/null 2>&1 || true' EXIT
T0=$(date +%s.%N); sleep 1.5; mark start
a shell input tap 930 2077; sleep 1.3                 # Daha fazla
a shell input tap 844 1705; sleep 3.0; mark collections_open   # Koleksiyonlar
a shell input tap 802 1077; sleep 3.5; mark collection_open    # Salavat ve Selam (2. sutun, 1. satir)
for ((i = 0; i < CARD_SWIPES; i++)); do a shell input swipe 540 2000 540 600 700; sleep 1.2; done
a shell input swipe 540 1900 540 650 900; sleep 1.2    # Cuma karti basligi ust kenara
a shell input swipe 540 800 540 1150 900; sleep 1.5; mark card_visible   # ~250-350px geri (fling degisken): baslik y~300-600
# statik kart ekraninda tek dump: Sayaca Ekle (basliktan sonraki ilk) konumu + kaynak satiri bbox'i ($DUMP)
a shell uiautomator dump /sdcard/u.xml >/dev/null 2>&1 || true; a shell cat /sdcard/u.xml > "${DUMP:-/tmp/cuma06-card.xml}"
BTN=$(python3 - "${DUMP:-/tmp/cuma06-card.xml}" "$DHIKR_TITLE" <<'PY'
import re,sys
x=open(sys.argv[1],encoding="utf-8").read(); seen=False
for n in re.findall(r"<node [^>]*>",x):
    t=re.search(r'text="([^"]*)"',n); b=re.search(r'bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"',n)
    if not t or not b: continue
    if t.group(1)==sys.argv[2]: seen=True
    if seen and t.group(1)=="Sayaca Ekle":
        v=list(map(int,b.groups())); print((v[0]+v[2])//2,(v[1]+v[3])//2); break
PY
)
[ -n "$BTN" ] || { echo "SAYACA EKLE NOT FOUND"; exit 3; }
sleep 1.8; mark source_end
a shell input tap $BTN; sleep 0.5; mark sayaca_ekle_tap
sleep 2.5; mark counter_ready
mark first_tap
a shell "i=0; while [ \$i -lt $TARGET ]; do input tap 540 860; i=\$((i+1)); done"
mark count_done
sleep 2.5; mark settled
if [ -n "$DRY" ]; then a exec-out screencap -p > "${DRY_PNG:-/tmp/cuma06-dry.png}"; exit 0; fi
a shell pkill -INT screenrecord || true; wait $REC || true; sleep 2; REC=
a pull /sdcard/cuma06-BC-phone.mp4 "$S/cuma-06-BC-phone.mp4" >/dev/null
ffmpeg -y -v error -i "$S/cuma-06-BC-phone.mp4" -vf fps=60 -an -c:v libx264 -crf 16 -preset medium -pix_fmt yuv420p "$S/cuma-06-BC-phone-cfr.mp4"
ffprobe -v error -show_entries stream=width,height,r_frame_rate,nb_frames -show_entries format=duration -of default=nw=1 "$S/cuma-06-BC-phone-cfr.mp4"
