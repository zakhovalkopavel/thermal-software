#!/usr/bin/env python3
"""Verify unresolved CAS via free sources: PubChem → NIST → CACTUS → ChemicalBook → LookChem.

PubChem/NIST formulas are trusted. ChemicalBook/LookChem/CACTUS formulas are verified
against the name (and Mr). Unverified hits get status ``needs_recheck`` and are written
to ``cas-external-recheck.json`` — they are not merged into proposals.

Writes ``tmp/reports/python/compound-data/cas-external-formulas.csv`` and merges
solid ``found`` formulas into ``name-formula-proposals.csv`` (status ``external_verify``).

Pass ``--cas-list`` (JSON list of ``{cas, name?}`` or plain CAS-per-line) to re-check
a fixed set (e.g. LookChem junk formula ``C``) without reading unresolved.json.
"""
from __future__ import annotations

import argparse
import csv
import importlib.util
import json
import sys
import types
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SRC = ROOT / "python" / "src"
MOD_PATH = SRC / "compound_data" / "cas_external_lookup.py"

if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))


def _load_lookup():
    """Load cas_external_lookup without importing compound_data.__init__ (rdkit)."""
    pkg = types.ModuleType("compound_data")
    pkg.__path__ = [str(SRC / "compound_data")]
    sys.modules.setdefault("compound_data", pkg)
    spec = importlib.util.spec_from_file_location(
        "compound_data.cas_external_lookup", MOD_PATH,
    )
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    sys.modules["compound_data.cas_external_lookup"] = mod
    spec.loader.exec_module(mod)
    return mod


def load_cas_list(path: Path) -> list[tuple[str, str]]:
    """Load CAS (+ optional label) from JSON list or plaintext CAS lines."""
    text = path.read_text(encoding="utf-8")
    if path.suffix.lower() == ".json":
        data = json.loads(text)
        if isinstance(data, dict):
            data = data.get("entries") or data.get("items") or []
        out: list[tuple[str, str]] = []
        for e in data:
            if isinstance(e, str):
                out.append((e, ""))
            else:
                cas = str(e.get("cas") or "").strip()
                if not cas:
                    continue
                label = str(e.get("name") or e.get("label") or "").strip()
                out.append((cas, label))
        return out
    out = []
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.split("\t", 1)
        cas = parts[0].strip()
        label = parts[1].strip() if len(parts) > 1 else ""
        out.append((cas, label))
    return out


def write_recheck_json(rows: list[dict[str, str]], path: Path) -> int:
    """Persist ``needs_recheck`` rows for manual formula review."""
    entries = [r for r in rows if r.get("status") == "needs_recheck"]
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(
            {
                "policy": (
                    "PubChem/NIST trusted; CACTUS/ChemicalBook/LookChem verified. "
                    "These rows failed verification (name/Mr) and need manual check."
                ),
                "count": len(entries),
                "entries": entries,
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    return len(entries)


def merge_into_proposals(proposals_path: Path, verify_rows: list[dict[str, str]]) -> int:
    """Fill empty proposal formulas from solid external hits only. Returns number updated."""
    if not proposals_path.is_file():
        return 0
    by_cas = {
        r["cas"]: r
        for r in verify_rows
        if r.get("status") == "found" and r.get("formula")
    }
    with proposals_path.open(encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
        fields = list(rows[0].keys()) if rows else [
            "cas", "label", "formula", "status", "method", "notes",
        ]
    updated = 0
    for row in rows:
        if row.get("formula"):
            continue
        hit = by_cas.get(row["cas"])
        if not hit:
            continue
        row["formula"] = hit["formula"]
        row["status"] = "external_verify"
        row["method"] = hit["source"]
        name = hit.get("name") or ""
        row["notes"] = f"external name: {name}" if name else "external CAS lookup"
        updated += 1
    with proposals_path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)
    return updated


def main() -> int:
    lookup = _load_lookup()
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument(
        "--unresolved",
        type=Path,
        default=ROOT / "shared/processed/compound-data/unresolved.json",
    )
    p.add_argument(
        "--proposals",
        type=Path,
        default=ROOT / "tmp/reports/python/compound-data/name-formula-proposals.csv",
    )
    p.add_argument(
        "--out",
        type=Path,
        default=ROOT / "tmp/reports/python/compound-data/cas-external-formulas.csv",
    )
    p.add_argument(
        "--out-recheck",
        type=Path,
        default=ROOT / "tmp/reports/python/compound-data/cas-external-recheck.json",
    )
    p.add_argument(
        "--cas-list",
        type=Path,
        default=None,
        help="JSON or CAS-per-line file; skips unresolved.json selection",
    )
    p.add_argument("--delay", type=float, default=0.25)
    p.add_argument("--limit", type=int, default=0, help="Max CAS to look up (0 = all)")
    p.add_argument(
        "--all",
        action="store_true",
        help="Look up every unresolved CAS (ignore formulas already in proposals)",
    )
    p.add_argument("--no-merge", action="store_true", help="Do not update proposals CSV")
    p.add_argument(
        "--no-enrich",
        action="store_true",
        help="Skip identifier enrichment (faster ChemicalBook-only checks)",
    )
    args = p.parse_args()

    if args.cas_list:
        items = load_cas_list(args.cas_list)
    else:
        proposals = None if args.all else args.proposals
        items = lookup.unresolved_cas_needing_formula(args.unresolved, proposals)
    if args.limit:
        items = items[: args.limit]
    print(
        f"looking up {len(items)} CAS "
        "(PubChem → NIST → CACTUS → ChemicalBook → LookChem; "
        "marketplace formulas verified)",
        flush=True,
    )
    rows = lookup.verify_cas_list(
        items, delay_s=args.delay, enrich=not args.no_enrich,
    )
    lookup.write_verify_csv(rows, args.out)
    found = sum(1 for r in rows if r["status"] == "found")
    recheck_n = write_recheck_json(rows, args.out_recheck)
    by_src: dict[str, int] = {}
    for r in rows:
        if r["status"] == "found":
            by_src[r["source"]] = by_src.get(r["source"], 0) + 1
    print(
        f"wrote {args.out}  found={found}/{len(rows)}  "
        f"needs_recheck={recheck_n} → {args.out_recheck}  by_source={by_src}"
    )
    if not args.no_merge and not args.cas_list:
        n = merge_into_proposals(args.proposals, rows)
        print(f"merged {n} solid formulas into {args.proposals}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
