#!/bin/sh
# Print grouped, annotated help from scripts/make.d/*.mk (POSIX sh)
NAME_COLOR="$(printf '\033[1;32m')"
DESC_COLOR="$(printf '\033[1;36m')"
SETUP_COLOR="$(printf '\033[1;33m')"
HEADER_COLOR="$(printf '\033[1;34m')"
RESET="$(printf '\033[0m')"

for f in scripts/make.d/*.mk; do
  # produce entries as name<SEP>desc using awk to avoid fragile shell parsing
  entries=$(awk -F '##' '/##/ { split($1,a,":"); name=a[1]; gsub(/^[ \t]+|[ \t]+$/, "", name); desc=$2; gsub(/^[ \t]+|[ \t]+$/, "", desc); print name "\034" desc }' "$f")
  if [ -n "${entries}" ]; then
    group=$(basename "$f" .mk)
    group=$(echo "$group" | sed -E 's/^[0-9]+-//' | sed -E 's/-/ /g' | awk '{for(i=1;i<=NF;i++){ $i=toupper(substr($i,1,1)) tolower(substr($i,2)) } print }')
    printf '\n%s%s%s\n' "$HEADER_COLOR" "$group" "$RESET"
    printf '%s\n' "$entries" | while IFS= read -r item; do
      name=$(printf '%s' "$item" | awk -F '\034' '{print $1}')
      desc=$(printf '%s' "$item" | awk -F '\034' '{print $2}')
      if [ "$name" = "setup" ]; then
        printf '  %b%-25s%b %b%s%b\n' "$SETUP_COLOR" "$name" "$RESET" "$SETUP_COLOR" "$desc" "$RESET"
      else
        printf '  %b%-25s%b %b%s%b\n' "$NAME_COLOR" "$name" "$RESET" "$DESC_COLOR" "$desc" "$RESET"
      fi
    done
  fi
done

printf '\nTip: annotate targets with '\''## description'\'' to make them appear here.\n'
