#!/usr/bin/env bash
# Fill each vendor submodule .env from the main project .env.
# Keys come from each vendor's .env.example; values from the host .env when set.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOST_ENV="${1:-$ROOT/.env}"

if [[ ! -f "$HOST_ENV" ]]; then
  echo "ERROR: host .env not found at $HOST_ENV (run: make setup)" >&2
  exit 1
fi

synced=0
shopt -s nullglob
for example in "$ROOT"/vendor/*/.env.example; do
  vendor_dir="$(dirname "$example")"
  name="$(basename "$vendor_dir")"
  dest="$vendor_dir/.env"

  if [[ -f "$vendor_dir/src/page_ocr/install.py" ]]; then
    PAGE_OCR_HOST_ENV="$HOST_ENV" PYTHONPATH="$vendor_dir/src${PYTHONPATH:+:$PYTHONPATH}" \
      python3 - "$HOST_ENV" "$example" "$dest" <<'PY'
from pathlib import Path
import sys
from page_ocr.install import sync_dotenv_from_host

host, example, dest = map(Path, sys.argv[1:4])
sync_dotenv_from_host(host_env=host, dest=dest, template=example)
PY
  else
    python3 - "$HOST_ENV" "$example" "$dest" <<'PY'
import sys
from pathlib import Path

host, example, dest = map(Path, sys.argv[1:4])

def parse(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        if key:
            out[key] = value.strip().strip("'").strip('"')
    return out

host_values = parse(host)
lines = [f"# Generated from host {host} (keys from {example.name}). Do not commit.", ""]
wrote = 0
for raw in example.read_text(encoding="utf-8").splitlines():
    stripped = raw.strip()
    if not stripped or stripped.startswith("#") or "=" not in stripped:
        lines.append(raw)
        continue
    key = stripped.split("=", 1)[0].strip()
    if key in host_values:
        lines.append(f"{key}={host_values[key]}")
        wrote += 1
    else:
        lines.append(raw)
dest.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
print(f"synced {wrote} env value(s) from {host} → {dest}")
PY
  fi
  echo "  vendor/$name/.env ready"
  synced=$((synced + 1))
done

if [[ "$synced" -eq 0 ]]; then
  echo "No vendor/*/ .env.example found under $ROOT/vendor" >&2
  exit 1
fi
echo "Synced $synced vendor env file(s) from $HOST_ENV"
