#!/usr/bin/env bash

set -u

PORT="5500"
LOG_FILE="/tmp/copao-preview.log"
PORT_LOG_FILE="/tmp/copao-port-visibility.log"

pkill -f "python3 -m http.server ${PORT}" >/dev/null 2>&1 || true
nohup python3 -m http.server "${PORT}" --bind 0.0.0.0 >"${LOG_FILE}" 2>&1 &

for _ in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:${PORT}" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if command -v gh >/dev/null 2>&1 && [ -n "${CODESPACE_NAME:-}" ]; then
  for _ in $(seq 1 30); do
    if gh codespace ports visibility "${PORT}:public" -c "${CODESPACE_NAME}" >"${PORT_LOG_FILE}" 2>&1; then
      exit 0
    fi
    sleep 2
  done
fi

exit 0
