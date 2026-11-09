#!/usr/bin/env python3
"""ChemicalBook-only CAS scrape for doubtful / LookChem-junk rows.

Reads a JSON CAS list (``[{cas, name}, ...]``), hits
``https://www.chemicalbook.com/CASEN_{cas}.htm``, verifies marketplace formulas
(name / Mr — never trust CB blindly), and writes:

* ``chemicalbook-verify.csv`` — every field we can parse + verification
* ``chemicalbook-recheck.json`` — CB hits that failed verification (or empty CB)
  for manual checking (e.g. osmium pentacarbonyl → Os(CO)5 / C5O5Os, not C5H10O5Os)
* ``chemicalbook-inconsistent.json`` — alias of the recheck list (compat)
"""
from __future__ import annotations

import argparse
import csv
import importlib.util
import json
import sys
import time
import types
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SRC = ROOT / "python" / "src"
MOD_PATH = SRC / "compound_data" / "cas_external_lookup.py"
ACCEPTED = SRC / "compound_data" / "constants" / "accepted_name_formulas.json"

if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))


def _load_lookup():
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


def _norm_name(s: str | None) -> str:
    if not s:
        return ""
    return " ".join(s.lower().replace("−", "-").split())


def main() -> int:
    lookup = _load_lookup()
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument(
        "--cas-list",
        type=Path,
        default=ROOT / "tmp/reports/python/compound-data/c-junk-cas.json",
    )
    p.add_argument(
        "--out-csv",
        type=Path,
        default=ROOT / "tmp/reports/python/compound-data/chemicalbook-verify.csv",
    )
    p.add_argument(
        "--out-recheck",
        type=Path,
        default=ROOT / "tmp/reports/python/compound-data/chemicalbook-recheck.json",
    )
    p.add_argument(
        "--out-json",
        type=Path,
        default=ROOT
        / "tmp/reports/python/compound-data/chemicalbook-inconsistent.json",
    )
    p.add_argument("--delay", type=float, default=0.35)
    p.add_argument("--limit", type=int, default=0)
    args = p.parse_args()

    items = json.loads(args.cas_list.read_text(encoding="utf-8"))
    if args.limit:
        items = items[: args.limit]
    accepted = {}
    if ACCEPTED.is_file():
        accepted = json.loads(ACCEPTED.read_text(encoding="utf-8"))

    fields = [
        "cas", "our_name", "our_formula", "our_hill", "our_display",
        "cb_status", "cb_formula", "expected_formula", "cb_name", "cb_synonyms",
        "cb_mr", "cbnumber", "cb_url", "notes", "issue",
    ]
    rows: list[dict[str, str]] = []
    recheck: list[dict] = []

    print(f"ChemicalBook scrape + verify: {len(items)} CAS", flush=True)
    for i, e in enumerate(items, 1):
        cas = e["cas"] if isinstance(e, dict) else str(e)
        our_name = (e.get("name") if isinstance(e, dict) else None) or ""
        acc = accepted.get(cas) or {}
        our_formula = acc.get("formula") or acc.get("hill") or ""
        our_hill = acc.get("hill") or ""
        our_display = acc.get("display_formula") or ""
        if not our_name:
            reason = acc.get("reason") or ""
            our_name = reason.split("; ", 1)[-1] if "; " in reason else reason

        raw = lookup.lookup_chemicalbook(cas)
        # Prefer our label when CB has no name (still need name for carbonyl check).
        if not raw.name and our_name:
            from dataclasses import replace as _replace
            raw = _replace(raw, name=our_name)
        r = lookup.apply_formula_verification(raw) if raw.status == "found" else raw

        issue_parts: list[str] = []
        if r.status == "needs_recheck":
            issue_parts.append("needs_recheck")
        elif r.status == "not_found" or not r.formula:
            issue_parts.append("cb_no_formula")
        if our_formula in ("", "C") or our_hill == "C" or our_display == "C":
            issue_parts.append("our_formula_C")
        if (
            r.status == "found"
            and r.formula
            and our_formula
            and our_formula != "C"
            and r.formula not in (our_hill, our_display, our_formula)
        ):
            issue_parts.append("formula_mismatch")
        if r.status == "found" and r.formula and (our_formula == "C" or our_hill == "C"):
            issue_parts.append("cb_verified_replaces_C")
        if r.name and our_name and _norm_name(r.name) != _norm_name(our_name):
            syn = _norm_name(r.synonyms)
            if _norm_name(our_name) not in syn and _norm_name(our_name) not in _norm_name(r.name):
                issue_parts.append("name_mismatch")

        # Recheck list = failed verification OR empty CB. Verified replacements are OK to apply.
        on_recheck = r.status in ("needs_recheck", "not_found") or (
            "needs_recheck" in issue_parts or "cb_no_formula" in issue_parts
        )

        row = {
            "cas": cas,
            "our_name": our_name,
            "our_formula": our_formula,
            "our_hill": our_hill,
            "our_display": our_display,
            "cb_status": r.status,
            "cb_formula": r.formula or "",
            "expected_formula": r.expected_formula or "",
            "cb_name": r.name or "",
            "cb_synonyms": r.synonyms or "",
            "cb_mr": f"{r.mr:g}" if r.mr is not None else "",
            "cbnumber": r.cbnumber or "",
            "cb_url": lookup.CHEMICALBOOK_CAS_URL.format(cas=cas),
            "notes": r.notes or "",
            "issue": ",".join(issue_parts) if issue_parts else "ok",
        }
        rows.append(row)
        if on_recheck:
            recheck.append(row)
        print(
            f"[{i}/{len(items)}] {cas} {r.status} "
            f"formula={r.formula!r} expected={r.expected_formula!r} "
            f"issue={row['issue']}",
            flush=True,
        )
        time.sleep(args.delay)

    args.out_csv.parent.mkdir(parents=True, exist_ok=True)
    with args.out_csv.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)

    payload = {
        "source": "chemicalbook",
        "policy": "PubChem/NIST trusted; ChemicalBook formulas verified vs name/Mr",
        "cas_list": str(args.cas_list),
        "total": len(rows),
        "recheck_count": len(recheck),
        "ok_count": sum(1 for r in rows if r["issue"] == "ok"),
        "cb_verified": sum(1 for r in rows if r["cb_status"] == "found"),
        "cb_needs_recheck": sum(1 for r in rows if r["cb_status"] == "needs_recheck"),
        "entries": recheck,
    }
    text = json.dumps(payload, indent=2, ensure_ascii=False) + "\n"
    args.out_recheck.write_text(text, encoding="utf-8")
    args.out_json.write_text(text, encoding="utf-8")
    print(
        f"wrote {args.out_csv}  verified={payload['cb_verified']}  "
        f"needs_recheck={payload['cb_needs_recheck']}  "
        f"recheck_list={len(recheck)} → {args.out_recheck}",
        flush=True,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
