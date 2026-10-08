#!/bin/bash
# AI Sohbet promo kaydı 05 (gerçek Samsung telefon, prod uygulama). Beat işaretleri stdout'a yazılır.
#
# Prerequisites:
# - Samsung phone selected via `export ANDROID_SERIAL=<serial from adb devices>` (1080x2340), unlocked and awake,
#   Zikirmatik Play release signed in with the real Premium Google account (>=1 AI credit).
# - ADBKeyBoard IME active (com.android.adbkeyboard/.AdbIME; official senzhk/ADBKeyBoard APK; Play Protect
#   prompt "Yine de yükle" must be accepted on the phone):
#     adb shell ime enable com.android.adbkeyboard/.AdbIME
#     adb shell ime set com.android.adbkeyboard/.AdbIME
#   Restore afterwards: adb shell ime set com.samsung.android.honeyboard/.service.HoneyBoardService
# - Do Not Disturb on: adb shell cmd notification set_dnd priority   (restore: set_dnd off)
# - Notification shade closed. The script opens the chat itself via deep link zikirmatik://ai-chat (new/empty chat).
# - Coordinates are device pixels for 1080x2340 (from uiautomator bounds): input [53,2019][1028,2175],
#   send [902,2040][1007,2145] (with ADBKeyBoard bar up: [902,1981][1007,2086], found dynamically), status bar y 0-~100, nav bar y ~2195-2340, "Son Sohbetler" list y 300-813.
# This spends 1 AI credit. Output: public/recordings/ai-chat-05.mp4 (+ final uiautomator dump in $DUMP).
set -e
: "${ANDROID_SERIAL:?export ANDROID_SERIAL=<serial from adb devices>}"
export LC_ALL=en_US.UTF-8
a() { adb "$@"; }
S="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/public/recordings"
DUMP="${DUMP:-/tmp/ai-chat-05-final.xml}"
T0=$(date +%s.%N)
mark() { printf '%s %.2f\n' "$1" "$(echo "$(date +%s.%N) - $T0" | bc)"; }
TEXT="Teyemmüm ne zaman ve nasıl yapılır?"
ui() { a shell "uiautomator dump /sdcard/u.xml >/dev/null; cat /sdcard/u.xml" 2>/dev/null || true; }

a shell cmd statusbar collapse
a shell am start -a android.intent.action.VIEW -d "zikirmatik://ai-chat" com.zikirmatik_asistan.app >/dev/null
sleep 2.5
a shell "screenrecord --bit-rate 16000000 --time-limit 180 /sdcard/ai05.mp4" &
REC=$!
T0=$(date +%s.%N)
sleep 2.0; mark start
a shell input tap 540 2097               # giriş kutusu
sleep 0.8
for ((i = 0; i < ${#TEXT}; i++)); do
  c="${TEXT:i:1}"
  if [ "$c" = " " ]; then a shell input keyevent 62
  else a shell am broadcast -a ADB_INPUT_B64 --es msg "$(printf '%s' "$c" | base64)" >/dev/null; fi   # B64: '?' vb. kabuk tırnak sorunu yok
  sleep 0.08
done
mark typed
sleep 0.8
# ADBKeyBoard çubuğu açılınca düzen ~60px yukarı kayar: gönder butonunu dump'tan bul, yazılan metni doğrula
UI=$(ui)
echo "$UI" | grep -q "text=\"$TEXT\"" || { echo "TEXT MISMATCH"; a shell pkill -INT screenrecord || true; wait $REC || true; exit 2; }
SB=$(echo "$UI" | grep -o 'resource-id="e2e-ai-chat-send"[^>]*bounds="\[[0-9]*,[0-9]*\]\[[0-9]*,[0-9]*\]"' | grep -o '\[[0-9]*,[0-9]*\]\[[0-9]*,[0-9]*\]')
SX=$(echo "$SB" | sed -E 's/\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]/\1 \3/' | awk '{print int(($1+$2)/2)}')
SY=$(echo "$SB" | sed -E 's/\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]/\2 \4/' | awk '{print int(($1+$2)/2)}')
a shell input tap "$SX" "$SY"            # gönder (~954,2033)
mark sent
sleep 2
ANSWERED=0
WAIT0=$(date +%s)
while [ $(( $(date +%s) - WAIT0 )) -lt 90 ]; do
  UI=$(ui)
  if echo "$UI" | grep -q ', s\. ' && ! echo "$UI" | grep -Eq 'Sohbet başlatılıyor|Mesajın değerlendiriliyor|Kaynaklar taranıyor|Yazıyor\.\.\.'; then ANSWERED=1; break; fi
  if echo "$UI" | grep -q 'Mesaj gönderilemedi\|yanıt veremiyor'; then break; fi
  sleep 0.7
done
echo "$UI" > "$DUMP"
if [ "$ANSWERED" != 1 ]; then
  mark timeout
  a shell pkill -INT screenrecord || true
  wait $REC || true
  exit 1
fi
mark answer
sleep 1.5
# alıntı satırı giriş çubuğunun altında kalmasın: alt kenarını ~1850'ye getir
CB=$(echo "$UI" | grep -o 'text="[^"]*, s\. [^"]*"[^>]*bounds="\[[0-9]*,[0-9]*\]\[[0-9]*,[0-9]*\]"' | tail -1 | sed -E 's/.*\]\[[0-9]+,([0-9]+)\]"$/\1/')
D=$(( ${CB:-1700} - 1850 ))
if [ "$D" -gt 0 ]; then a shell input swipe 540 1700 540 $(( 1700 - D )) 1200; fi
sleep 0.9; mark citation
sleep 3.0
mark end
a shell pkill -INT screenrecord || true
wait $REC || true
sleep 2
a pull /sdcard/ai05.mp4 "$S/ai-chat-05.mp4" >/dev/null
ffprobe -v error -show_entries stream=width,height,r_frame_rate,duration -of csv=p=0 "$S/ai-chat-05.mp4"
