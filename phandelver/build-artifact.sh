#!/bin/sh
# Собирает копию игры для публикации как Artifact: страница без обёртки <html>/<head>/<body>.
set -e
SRC="$(cd "$(dirname "$0")" && pwd)"
OUT="${1:?укажите папку назначения}"
mkdir -p "$OUT/js"
cp "$SRC/style.css" "$OUT/"
cp "$SRC"/js/*.js "$OUT/js/"
grep -v -x -e '<!doctype html>' -e '<html lang="ru">' -e '<head>' -e '<meta charset="utf-8">' \
  -e '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">' \
  -e '</head>' -e '<body>' -e '</body>' -e '</html>' "$SRC/index.html" > "$OUT/index.html"
