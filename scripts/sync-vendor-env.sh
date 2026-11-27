#!/usr/bin/env bash
# Fill each vendor submodule .env from the main project .env.
# Keys come from each vendor's .env.example; values from the host .env when set.
#
# Pure bash — no host Python. Docker-first setup must work before images exist
# (see docs/migration/DOCKER_FIRST_SETUP.md).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOST_ENV="${1:-$ROOT/.env}"

if [[ ! -f "$HOST_ENV" ]]; then
  echo "ERROR: host .env not found at $HOST_ENV (run: make setup)" >&2
  exit 1
fi

# Look up KEY in an env file; prints value (may be empty) and returns 0 if key exists.
env_get() {
  local file="$1" key="$2" line
  while IFS= read -r line || [[ -n "$line" ]]; do
    case "$line" in
      ''|\#*) continue ;;
    esac
    if [[ "$line" == "$key="* ]]; then
      printf '%s' "${line#*=}"
      return 0
    fi
  done < "$file"
  return 1
}

sync_one() {
  local example="$1" dest="$2" host="$3"
  local tmp wrote=0 line stripped key host_val

  tmp="$(mktemp)"
  {
    echo "# Generated from host ${host} (keys from $(basename "$example")). Do not commit."
    echo ""
    while IFS= read -r line || [[ -n "$line" ]]; do
      stripped="${line#"${line%%[![:space:]]*}"}"
      if [[ -z "$stripped" || "$stripped" == \#* || "$stripped" != *=* ]]; then
        printf '%s\n' "$line"
        continue
      fi
      key="${stripped%%=*}"
      key="${key%"${key##*[![:space:]]}"}"
      if host_val="$(env_get "$host" "$key")"; then
        printf '%s=%s\n' "$key" "$host_val"
        wrote=$((wrote + 1))
      else
        printf '%s\n' "$line"
      fi
    done < "$example"
  } > "$tmp"

  # page-ocr: accept Modal tokens from host even if absent from .env.example
  for key in MODAL_TOKEN_ID MODAL_TOKEN_SECRET; do
    if host_val="$(env_get "$host" "$key")"; then
      if ! grep -q "^${key}=" "$tmp"; then
        printf '%s=%s\n' "$key" "$host_val" >> "$tmp"
        wrote=$((wrote + 1))
      fi
    fi
  done

  mv "$tmp" "$dest"
  echo "synced ${wrote} env value(s) from ${host} → ${dest}"
}

synced=0
shopt -s nullglob
for example in "$ROOT"/vendor/*/.env.example; do
  vendor_dir="$(dirname "$example")"
  name="$(basename "$vendor_dir")"
  dest="$vendor_dir/.env"

  sync_one "$example" "$dest" "$HOST_ENV"
  echo "  vendor/$name/.env ready"
  synced=$((synced + 1))
done

if [[ "$synced" -eq 0 ]]; then
  echo "No vendor/*/ .env.example found under $ROOT/vendor" >&2
  exit 1
fi
echo "Synced $synced vendor env file(s) from $HOST_ENV"
