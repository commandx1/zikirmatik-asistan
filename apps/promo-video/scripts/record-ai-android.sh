#!/bin/bash
# AI Rehber promo kaydı (Android emülatör, prod API). Beat işaretleri stdout'a yazılır.
#
# Prerequisites (see README-short.md "AI Rehber klibi" for the full story):
# - A booted Android emulator running the android.emu.prod Detox build (real prod API, not
#   a local/e2e one), already signed in with a real Google account (so "36 kredi" etc. show
#   real balances, not a fresh-guest/e2e placeholder).
# - Emulator locale set to Turkish and status bar in "demo mode" (clean 09:41/full bars, no
#   notification icons) before recording:
#     adb shell settings put global sysui_demo_allowed 1
#     adb shell am broadcast -a com.android.systemui.demo -e command enter
#     adb shell am broadcast -a com.android.systemui.demo -e command clock -e hhmm 0941
#     adb shell am broadcast -a com.android.systemui.demo -e command battery -e level 100 -e plugged false
#     adb shell am broadcast -a com.android.systemui.demo -e command network -e wifi show -e level 4 -e mobile show -e level 4 -e datatype none
#   (exit demo mode afterwards with `-e command exit`).
# - The app already open on the AI Rehber tab's PREVIOUS screen when this script starts (it
#   taps to dismiss a settings toast, goes back, then opens the AI tab itself) — adjust the
#   two leading taps' coordinates for your device/screen if the app isn't in that exact state.
# - Tap coordinates throughout are device-pixel coordinates for the emulator skin used when
#   this was recorded (1080x2400) — recalibrate them (e.g. via `adb shell wm size` +
#   `adb exec-out screencap` inspection) for a different emulator resolution.
set -e
S="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/public/recordings"
T0=$(date +%s.%N)
mark() { printf '%s %.2f\n' "$1" "$(echo "$(date +%s.%N) - $T0" | bc)"; }

adb shell input tap 540 2240            # yazı tipi: Değişiklikleri Kaydet
sleep 1.5
adb shell input keyevent 4              # geri
sleep 1.5
adb shell input tap 540 2235            # AI sekmesi
sleep 3

adb shell "screenrecord --bit-rate 16000000 --time-limit 90 /sdcard/ai.mp4" &
REC=$!
sleep 2.0; mark start
adb shell input tap 540 330             # niyet kutusu
sleep 1.0
adb shell input text "sabah%syolda%shuzur%sbulmak"
sleep 1.2; mark typed
adb shell input tap 972 320             # gönder
mark sent
sleep 22                                # cevap bekle
mark answer
adb shell input swipe 540 1500 540 900 900   # yavaş kaydır
sleep 3
adb shell input swipe 540 1500 540 1000 900
sleep 3; mark end
adb shell pkill -INT screenrecord || true
wait $REC || true
sleep 2
adb pull /sdcard/ai.mp4 "$S/ai-rehber.mp4" >/dev/null
ffprobe -v error -show_entries stream=width,height,r_frame_rate,duration -of csv=p=0 "$S/ai-rehber.mp4"
# Output lands directly at public/recordings/ai-rehber.mp4 (no separate trim step — the
# RichVideo-01 composition picks its own A/B windows out of the full clip, see
# src/RichVideo.tsx's AI_REHBER_A_FROM/A_TO/B_FROM constants).
