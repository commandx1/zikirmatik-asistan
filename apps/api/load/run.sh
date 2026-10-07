#!/usr/bin/env bash
# Tek aşamalı koşu: monitor + k6 + analiz. Kullanım (apps/api'den):
#   load/run.sh <ad> <SCENARIO> [KEY=VALUE ...]   (k6 -e olarak geçer: STAGES, VUS, DURATION, ...)
# Ortam: BASE_URL (vars. :3010), MONGODB_URI, CONTAINER (docker) veya PID (yerel).
set -euo pipefail
NAME=$1; SCENARIO=$2; shift 2
OUT=load/out/$NAME
mkdir -p "$OUT"
BASE_URL=${BASE_URL:-http://127.0.0.1:3010}
KENV=()
STAGES=""; VUS=""
for kv in "$@"; do
  KENV+=(-e "$kv")
  case $kv in STAGES=*) STAGES=${kv#STAGES=};; VUS=*) VUS=${kv#VUS=};; esac
done
OUT="$OUT/monitor.jsonl" node load/monitor.mjs > "$OUT/monitor.log" 2>&1 &
MON=$!
sleep 7   # monitor ilk örneği alsın
START=$(( $(date +%s) * 1000 ))
k6 run --quiet --no-color -e SCENARIO="$SCENARIO" -e BASE_URL="$BASE_URL" -e RUN_ID="$NAME-$START" \
  -e SEED_FILE="${SEED_FILE:-./out/seed.json}" -e SUMMARY_OUT="$OUT/summary.json" ${KENV[@]+"${KENV[@]}"} load/run.js > "$OUT/k6.log" 2>&1 || true
END=$(( $(date +%s) * 1000 ))
SD=$(grep -o "SETUP_DONE [0-9]*" "$OUT/k6.log" | head -1 | cut -d" " -f2 || true)
[ -n "${SD:-}" ] && START=$SD
sleep 6
kill "$MON" 2>/dev/null || true; wait "$MON" 2>/dev/null || true
node -e "require('fs').writeFileSync('$OUT/meta.json', JSON.stringify({name:'$NAME',scenario:'$SCENARIO',start:$START,end:$END,stages:'$STAGES',vus:'$VUS'}))"
node load/analyze.mjs "$OUT"
