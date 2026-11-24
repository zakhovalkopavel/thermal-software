#!/usr/bin/env python3
"""Fix typographical table CAS using the Yaws appendix + external verification.

Policy
------
The CAS / synonym appendix is the identity index. Table rows sometimes print a
wrong CAS (OCR / typo). For every table CAS that is **not** in the appendix:

1. Find appendix candidates for the same compound **by name** (primary + synonyms).
2. Look up the table CAS and each appendix candidate (PubChem → NIST → …).
3. **Auto-update the table** only when:
   - exactly one appendix candidate is API-``found``, and
   - the printed table CAS is **not** API-``found`` (invalid / unassigned / junk).
4. If both the table CAS and an appendix CAS are found (isomers, mixtures, ambiguous
   names like "DIPHENYL"), leave the table unchanged and log for review.
5. Record confirmed ``wrong → right`` pairs in ``yaws1999.constants.CAS_TYPO_FIXES``
   so a later OCR rebuild does not recreate the typo.

Examples that auto-fix: ``72-02-5`` → ``75-02-5`` (vinyl fluoride),
``75-05-08`` → ``75-05-8`` (acetonitrile).

Usage
-----
  docker compose run --rm python python src/scripts/fix_yaws1999_table_cas.py
  docker compose run --rm python python src/scripts/fix_yaws1999_table_cas.py --apply
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import sys
import time
import types
from collections import defaultdict
from pathlib import Path

def _detect_roots() -> tuple[Path, Path]:
    """Return ``(repo_root, python_src)`` for host (`python/src`) or container (`/app/src`)."""
    here = Path(__file__).resolve()
    # .../python/src/scripts/this.py  or  /app/src/scripts/this.py
    src = here.parents[1]
    if (src / "yaws1999").is_dir() and (src / "compound_data").is_dir():
        # Container layout: /app/src → repo root /app
        if src.name == "src" and (src.parent / "shared").is_dir():
            return src.parent, src
        # Host layout: <repo>/python/src → repo root <repo>
        if src.name == "src" and src.parent.name == "python":
            return src.parents[1], src
    raise RuntimeError(f"cannot locate python src from {here}")


ROOT, SRC = _detect_roots()
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from compound_data.parsers.yaws1999_identity import (  # noqa: E402
    _norm_name,
    load_yaws1999_identity,
)
from pubchem.cas_number import is_cas  # noqa: E402
from yaws1999.constants import CAS_TYPO_FIXES, correct_cas  # noqa: E402

REPORT_DEFAULT = ROOT / "tmp/reports/python/compound-data/yaws1999-cas-table-fixes.json"
YAWS_DEFAULT = ROOT / "shared/processed/yaws1999"


def _load_lookup():
    """Load cas_external_lookup without importing compound_data.__init__ (rdkit)."""
    # Prefer already-importable module when running inside the full env.
    try:
        from compound_data import cas_external_lookup as mod  # type: ignore
        return mod
    except Exception:
        pass
    pkg = types.ModuleType("compound_data")
    pkg.__path__ = [str(SRC / "compound_data")]
    sys.modules.setdefault("compound_data", pkg)
    path = SRC / "compound_data" / "cas_external_lookup.py"
    spec = importlib.util.spec_from_file_location("compound_data.cas_external_lookup", path)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    sys.modules["compound_data.cas_external_lookup"] = mod
    spec.loader.exec_module(mod)
    return mod


def _name_index(identity) -> dict[str, list]:
    by_name: dict[str, list] = defaultdict(list)
    for idn in identity.by_cas.values():
        by_name[_norm_name(idn.name)].append(idn)
        for s in idn.synonyms:
            by_name[_norm_name(s)].append(idn)
    return by_name


def collect_candidates(yaws_dir: Path, identity, by_name) -> list[dict]:
    """Table rows whose (corrected) CAS is not in the appendix."""
    index = json.loads((yaws_dir / "index.json").read_text(encoding="utf-8"))
    out: list[dict] = []
    seen: set[tuple] = set()
    for meta in index.get("tables", []):
        rel, tid = meta.get("file"), meta.get("id")
        if not rel:
            continue
        path = yaws_dir / rel
        if not path.is_file():
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        for row in data.get("rows", []):
            raw = row.get("CAS_No") or row.get("cas")
            if not raw:
                continue
            raw_s = str(raw).strip()
            cas_s = correct_cas(raw_s) or raw_s
            if cas_s in identity.by_cas:
                continue
            name = row.get("name")
            key = (cas_s, _norm_name(name), tid, row.get("id"))
            if key in seen:
                continue
            seen.add(key)
            hits = by_name.get(_norm_name(name), [])
            app = {h.cas: h for h in hits if h.cas}
            out.append({
                "tableCas": cas_s,
                "tableCasRaw": raw_s,
                "tableCasValid": bool(is_cas(cas_s)),
                "name": name,
                "formula": row.get("formula"),
                "tableId": tid,
                "rowId": row.get("id"),
                "file": rel,
                "appendixCandidates": [
                    {"cas": c, "formula": h.formula, "name": h.name}
                    for c, h in sorted(app.items())
                ],
            })
    return out


def decide(table_cas: str, appendix_cases: list[str], api: dict[str, dict]) -> tuple[str | None, str]:
    """Return ``(chosen_cas_or_None, reason)`` under the safe auto-fix rule."""
    app_found = [c for c in appendix_cases if api.get(c, {}).get("status") == "found"]
    table_st = api.get(table_cas, {}).get("status")
    if len(app_found) == 1 and table_st != "found" and app_found[0] != table_cas:
        chosen = app_found[0]
        src = api[chosen].get("source")
        return chosen, f"appendix CAS API-found ({src}); table CAS {table_st}"
    if len(app_found) == 1 and table_st == "found" and app_found[0] != table_cas:
        return None, (
            "both API-found (isomer/mixture/ambiguous name) — leave table; review manually. "
            f"table={api[table_cas].get('name')!r} appendix={api[app_found[0]].get('name')!r}"
        )
    if len(app_found) > 1:
        return None, f"multiple API-found appendix CAS: {app_found}"
    if table_st == "found":
        return None, "table CAS found; no confirmed appendix replacement"
    return None, f"no safe fix (table={table_st}, appendix_found={app_found})"


def apply_fixes(yaws_dir: Path, fixes: list[dict]) -> list[dict]:
    by_file: dict[str, list[dict]] = defaultdict(list)
    for f in fixes:
        by_file[f["file"]].append(f)
    applied: list[dict] = []
    for rel, rows in by_file.items():
        path = yaws_dir / rel
        data = json.loads(path.read_text(encoding="utf-8"))
        by_id = {r.get("id"): r for r in data.get("rows", [])}
        changed = False
        for f in rows:
            row = by_id.get(f["rowId"])
            if not row:
                continue
            old = row.get("CAS_No") or row.get("cas")
            new = f["chosenCas"]
            if old == new:
                continue
            if "CAS_No" in row:
                row["CAS_No"] = new
            if "cas" in row:
                row["cas"] = new
            changed = True
            applied.append({
                "file": rel, "tableId": f["tableId"], "rowId": f["rowId"],
                "name": f["name"], "old": old, "new": new, "reason": f["reason"],
                "api": f["api"],
            })
        if changed:
            path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return applied


def merge_typo_constants(pairs: dict[str, str]) -> int:
    """Append new pairs into ``CAS_TYPO_FIXES`` in constants.py. Returns count added."""
    path = SRC / "yaws1999" / "constants.py"
    text = path.read_text(encoding="utf-8")
    added = 0
    # Insert before the closing ``}`` of CAS_TYPO_FIXES.
    marker = "CAS_TYPO_FIXES: dict[str, str] = {"
    if marker not in text:
        return 0
    start = text.index(marker)
    end = text.index("}", start)
    block = text[start:end]
    lines = []
    for wrong, right in sorted(pairs.items()):
        if wrong in CAS_TYPO_FIXES and CAS_TYPO_FIXES[wrong] == right:
            continue
        if f'"{wrong}"' in block:
            continue
        lines.append(f'    "{wrong}": "{right}",')
        added += 1
    if not lines:
        return 0
    insert_at = end
    text = text[:insert_at] + "\n".join(lines) + ("\n" if not text[insert_at - 1] == "\n" else "") + text[insert_at:]
    path.write_text(text, encoding="utf-8")
    return added


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--yaws-dir", type=Path, default=YAWS_DEFAULT)
    p.add_argument("--out", type=Path, default=REPORT_DEFAULT)
    p.add_argument("--delay", type=float, default=0.25)
    p.add_argument("--apply", action="store_true", help="Write confirmed CAS into processed table JSON")
    p.add_argument("--update-constants", action="store_true",
                   help="Merge confirmed pairs into yaws1999.constants.CAS_TYPO_FIXES")
    args = p.parse_args()

    lookup_mod = _load_lookup()
    identity = load_yaws1999_identity(
        args.yaws_dir / "appendix" / "CAS_Compound_Index.json",
        args.yaws_dir / "appendix" / "Name_and_Synonym_Index.json",
    )
    by_name = _name_index(identity)
    candidates = collect_candidates(args.yaws_dir, identity, by_name)
    unique = [c for c in candidates if len(c["appendixCandidates"]) == 1]
    multi = [c for c in candidates if len(c["appendixCandidates"]) > 1]
    none = [c for c in candidates if not c["appendixCandidates"]]
    print(
        f"table CAS not in appendix: {len(candidates)}  "
        f"(unique name hit={len(unique)}, multi={len(multi)}, no name={len(none)})"
    )

    cache: dict[str, object] = {}

    def lookup(cas: str):
        if cas in cache:
            return cache[cas]
        r = lookup_mod.lookup_cas(cas, enrich=False)
        cache[cas] = r
        time.sleep(args.delay)
        return r

    fixes: list[dict] = []
    review: list[dict] = []
    for i, c in enumerate(unique, 1):
        table_cas = c["tableCas"]
        app_cases = [a["cas"] for a in c["appendixCandidates"]]
        api: dict[str, dict] = {}
        for cas in dict.fromkeys([table_cas, *app_cases]):
            r = lookup(cas)
            api[cas] = {
                "status": r.status,
                "formula": r.formula,
                "name": r.name,
                "source": r.source,
                "notes": (r.notes or "")[:160],
            }
        chosen, reason = decide(table_cas, app_cases, api)
        entry = {**c, "api": api, "chosenCas": chosen, "reason": reason}
        (fixes if chosen else review).append(entry)
        if i % 10 == 0 or i == len(unique):
            print(f"  verified {i}/{len(unique)}  auto-fixes={len(fixes)} review={len(review)}")

    applied: list[dict] = []
    if args.apply and fixes:
        applied = apply_fixes(args.yaws_dir, fixes)
        print(f"applied {len(applied)} table CAS patches")
    elif fixes:
        print(f"dry-run: {len(fixes)} auto-fixes available (pass --apply to write)")

    pairs = dict(CAS_TYPO_FIXES)
    for f in (applied or fixes):
        wrong = f.get("old") or f["tableCas"]
        right = f.get("new") or f["chosenCas"]
        if wrong and right:
            pairs[wrong] = right
            raw = f.get("tableCasRaw")
            if raw and raw != wrong:
                pairs[raw] = right

    if args.update_constants and (applied or fixes):
        n = merge_typo_constants({
            (f.get("old") or f["tableCas"]): (f.get("new") or f["chosenCas"])
            for f in (applied or fixes)
        })
        print(f"merged {n} pairs into CAS_TYPO_FIXES")

    report = {
        "policy": decide.__doc__,
        "candidatesNotInAppendix": len(candidates),
        "uniqueNameMatched": len(unique),
        "multiNameMatched": len(multi),
        "noNameMatch": len(none),
        "autoFixes": [
            {
                "tableCas": f["tableCas"], "chosenCas": f["chosenCas"], "name": f["name"],
                "tableId": f["tableId"], "rowId": f["rowId"], "file": f["file"],
                "reason": f["reason"], "api": f["api"],
            }
            for f in fixes
        ],
        "reviewBothFoundOrAmbiguous": [
            {
                "tableCas": f["tableCas"], "name": f["name"],
                "tableId": f["tableId"], "rowId": f["rowId"],
                "appendixCandidates": f["appendixCandidates"],
                "reason": f["reason"], "api": f["api"],
            }
            for f in review
        ],
        "applied": applied,
        "casTypoPairs": pairs,
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
