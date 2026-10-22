#!/usr/bin/env bash
# Visual QA capture: step-scrolls the page so scroll-reveals fire,
# then takes full-page screenshots at the mandated viewports.
set -u
OUT="${2:-/home/z/my-project/tool-results/qa}"
URL="${1:-http://localhost:3000/}"
mkdir -p "$OUT"

for vp in "320 568" "375 812" "414 896" "768 1024" "1024 768" "1280 800" "1440 900" "1920 1080"; do
  W=${vp%% *}; H=${vp##* }
  agent-browser set viewport "$W" "$H" >/dev/null
  agent-browser open "$URL" >/dev/null
  agent-browser wait --load networkidle >/dev/null 2>&1
  # step-scroll to trigger IntersectionObserver reveals
  agent-browser eval "(() => { const h = document.body.scrollHeight; const step = window.innerHeight * 0.8; return {h, step}; })()" >/dev/null
  for i in $(seq 0 12); do
    agent-browser eval "window.scrollTo(0, Math.min(($i) * window.innerHeight * 0.8, document.body.scrollHeight))" >/dev/null
    sleep 0.25
  done
  agent-browser eval "window.scrollTo(0, 0)" >/dev/null
  sleep 0.8
  if agent-browser screenshot "$OUT/site-$W.png" --full >/dev/null 2>&1; then
    echo "$W OK"
  else
    echo "$W FAIL"
  fi
done
