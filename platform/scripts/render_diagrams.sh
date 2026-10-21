#!/usr/bin/env bash
# Render docs/diagrams/*.mmd to SVG and PNG with mermaid-cli (mmdc).
set -euo pipefail
cd "$(dirname "$0")/../docs/diagrams"
cat > /tmp/aegis-mermaid.json <<'JSON'
{"theme":"base","themeVariables":{"fontFamily":"Helvetica, Arial, sans-serif","fontSize":"15px","primaryColor":"#E8F1F8","primaryTextColor":"#0B2545","primaryBorderColor":"#0B2545","lineColor":"#5A6472"},"flowchart":{"htmlLabels":true,"curve":"basis"}}
JSON
for f in *.mmd; do
  b="${f%.mmd}"
  mmdc -q -i "$f" -o "$b.svg" -c /tmp/aegis-mermaid.json -b white
  mmdc -q -i "$f" -o "$b.png" -c /tmp/aegis-mermaid.json -b white -s 2
  echo "rendered $b"
done
