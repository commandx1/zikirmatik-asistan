#!/bin/bash
# AI Rehber promo kaydı 04 (gerçek Samsung telefon, prod uygulama). Beat işaretleri stdout'a yazılır.
#
# Prerequisites:
# - Samsung phone selected via `export ANDROID_SERIAL=<serial from adb devices>` (1080x2340), unlocked and awake, Zikirmatik
#   Play release (versionCode >= prod minVersion) signed in with the real Premium Google account.
# - ADBKeyBoard IME active (com.android.adbkeyboard/.AdbIME), so Turkish chars type via
#   `am broadcast -a ADB_INPUT_TEXT` and no on-screen keyboard appears:
#     adb shell ime enable com.android.adbkeyboard/.AdbIME
#     adb shell ime set com.android.adbkeyboard/.AdbIME
# - Do Not Disturb on (no heads-up banners): adb shell cmd notification set_dnd priority
# - Home counter reset to 0 (no unsaved progress, so Başla does not raise the "kaydedilmemiş ilerleme" modal).
# - AI tab open, scrolled to the TOP, intent box empty (initial "Asistan Rehber" screen).
# - Tap/swipe coordinates are device pixels for 1080x2340 (calibrated from screenshots, ratio 1.17 to the
#   900px-wide previews). Recalibrate for another device.
# This spends 1 AI credit. Exits with the pulled mp4 in public/recordings/ai-rehber-04.mp4.
set -e
: "${ANDROID_SERIAL:?export ANDROID_SERIAL=<serial from adb devices>}"
export LC_ALL=en_US.UTF-8
a() { adb "$@"; }
S="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/public/recordings"
T0=$(date +%s.%N)
mark() { printf '%s %.2f\n' "$1" "$(echo "$(date +%s.%N) - $T0" | bc)"; }
TEXT="yarın sınavım var, çok kaygılıyım"

a shell "screenrecord --bit-rate 16000000 --time-limit 180 /sdcard/ai04.mp4" &
REC=$!
sleep 2.0; mark start
a shell input tap 540 490                # niyet kutusu
sleep 0.8
for ((i = 0; i < ${#TEXT}; i++)); do
  c="${TEXT:i:1}"
  if [ "$c" = " " ]; then a shell input keyevent 62
  else a shell am broadcast -a ADB_INPUT_TEXT --es msg "$c" >/dev/null; fi
  sleep 0.08
done
mark typed
sleep 0.8
a shell input tap 953 374                # gönder
mark sent
sleep 3                                   # yükleme ekranı gelsin (eski sonuç ağaçta kalmasın)
ANSWERED=0
WAIT0=$(date +%s)
while [ $(( $(date +%s) - WAIT0 )) -lt 60 ]; do   # cevap: "Asistan çalışıyor" gitti + "Sana Özel Öneriler" var (üst sınır 60 sn)
  UI=$(a shell "uiautomator dump /sdcard/u.xml >/dev/null; cat /sdcard/u.xml" 2>/dev/null || true)
  if echo "$UI" | grep -q "Sana Özel Öneriler" && ! echo "$UI" | grep -q "Asistan çalışıyor"; then ANSWERED=1; break; fi
  sleep 1
done
if [ "$ANSWERED" != 1 ]; then
  mark timeout
  a shell pkill -INT screenrecord || true
  wait $REC || true
  exit 1
fi
mark answer
sleep 1.5
a shell input swipe 540 1700 540 1000 800   # birincil kart: başlık + ARAPÇA + OKUNUŞ + ANLAM
sleep 0.9; mark card
sleep 3.0
a shell input swipe 540 1900 540 400 500    # FAZİLET'i hızla geç: KAYNAK + hedef + Başla
sleep 0.9; mark kaynak
sleep 2.0
a shell input tap 545 620                   # Başla
mark start_counter
sleep 1.5
for _ in 1 2 3 4 5; do                      # sayaç: 5 dokunuş (hedef 7'ye ulaşma)
  a shell input tap 540 860
  sleep 0.55
done
mark counted
sleep 1.5; mark end
a shell pkill -INT screenrecord || true
wait $REC || true
sleep 2
a pull /sdcard/ai04.mp4 "$S/ai-rehber-04.mp4" >/dev/null
ffprobe -v error -show_entries stream=width,height,r_frame_rate,duration -of csv=p=0 "$S/ai-rehber-04.mp4"
