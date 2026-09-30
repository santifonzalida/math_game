#!/bin/sh
# Runs on container start (nginx image runs /docker-entrypoint.d/*.sh).
# Writes the runtime config so the same image works against any backend URL.
set -eu

cat > /usr/share/nginx/html/env.js <<JS
window.__env = { apiUrl: "${API_URL:-}" };
JS

echo "env.js: apiUrl=${API_URL:-<not set, using same host :3000>}"
