#!/usr/bin/env python3
"""
check_melting_points.py — CLI entry point: compare the CRC melting points of the compound data with
NASA-9 and NIST-JANAF and list the rows that differ by more than --limit kelvin, largest first.

Input
-----
  shared/processed/compound-data/inorganic/   — records with CRC95 meltingPoint values and the linked
                                                NASA-9 species keys / JANAF table ids (make compound-data-build)
  shared/processed/NASA/nasa9.json             — NASA-9 species
  shared/sources/compound-data/nist-janaf/py-janaf/data/ — JANAF tables

Reference melting points
------------------------
  NASA-9  — the temperature where a solid species' last range ends and a liquid species
            (``(L)``, ``(liq)``, ``(l)``) of the same record begins
  JANAF   — the ``CRYSTAL <--> LIQUID`` row of the linked crystal table

Output (stdout)
---------------
  diff K (the larger of |CRC − JANAF| and |CRC − NASA-9|), diff %, Hill formula, CRC variant, CRC,
  NASA-9 and JANAF values, JANAF table id, line in "Physical Constants of Inorganic Compounds.csv".

A difference is a candidate, not a verdict: decomposition (AlN, calcite), a polymorph that does not
melt (anatase) and outdated JANAF evaluations (CaO, Cr2O3) also show up.

Usage
-----
  docker compose run --rm python python src/scripts/check_melting_points.py [--limit 2]
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Optional

LIQUID_SUFFIXES = ("(L)", "(liq)", "(l)")
CRYSTAL_LIQUID = re.compile(r"^([\d.]+)\t.*CRYSTAL <--> LIQUID", re.M)


def _build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="List CRC melting points that differ from NASA-9 or NIST-JANAF.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    p.add_argument("--limit", metavar="K", type=float, default=2.0,
                   help="Smallest difference to list, in kelvin (default: %(default)s)")
    p.add_argument("--compound-data", metavar="DIR", type=Path, default=Path("shared/processed/compound-data"),
                   help="Compound data directory (default: %(default)s)")
    p.add_argument("--nasa9", metavar="FILE", type=Path, default=Path("shared/processed/NASA/nasa9.json"),
                   help="NASA-9 species file (default: %(default)s)")
    p.add_argument("--janaf-dir", metavar="DIR", type=Path,
                   default=Path("shared/sources/compound-data/nist-janaf/py-janaf/data"),
                   help="JANAF table directory (default: %(default)s)")
    return p


def _nasa_tm(keys: list[str], nasa: dict) -> Optional[float]:
    keys = [k for k in keys if k in nasa]
    liquid_starts = {round(nasa[k]["nasa9"]["ranges"][0]["Tmin"], 2) for k in keys if k.endswith(LIQUID_SUFFIXES)}
    solid_ends = {
        round(nasa[k]["nasa9"]["ranges"][-1]["Tmax"], 2)
        for k in keys if nasa[k]["phase"] == "condensed" and not k.endswith(LIQUID_SUFFIXES)
    }
    hits = sorted(solid_ends & liquid_starts)
    return hits[0] if hits else None


def _janaf_tm(ids: list[str], janaf_dir: Path) -> tuple[Optional[float], Optional[str]]:
    for table_id in ids:
        path = janaf_dir / f"{table_id}.txt"
        if not path.is_file():
            continue
        match = CRYSTAL_LIQUID.search(path.read_text(encoding="utf-8"))
        if match:
            return float(match.group(1)), table_id
    return None, None


def main(argv: list[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)
    inorganic = args.compound_data / "inorganic"
    for path in (inorganic, args.nasa9, args.janaf_dir):
        if not path.exists():
            print(f"Not found: {path}", file=sys.stderr)
            return 1

    nasa = json.loads(args.nasa9.read_text(encoding="utf-8"))["species"]
    rows = []
    for path in sorted(inorganic.rglob("*.json")):
        record = json.loads(path.read_text(encoding="utf-8"))
        entries = record["entries"].values() if isinstance(record["entries"], dict) else record["entries"]
        for entry in entries:
            for tm in entry.get("properties", {}).get("meltingPoint") or []:
                if tm["ref"][0] != "CRC95":
                    continue
                nasa_value = _nasa_tm(entry.get("nasa9") or [], nasa)
                janaf_value, janaf_id = _janaf_tm(entry.get("janaf") or [], args.janaf_dir)
                references = [v for v in (janaf_value, nasa_value) if v is not None]
                if not references:
                    continue
                diff = max(abs(tm["value"] - v) for v in references)
                if diff > args.limit:
                    rows.append((diff, record["hill"], tm.get("variant") or "", tm["value"],
                                 nasa_value, janaf_value, janaf_id, tm["ref"][1]))

    rows.sort(key=lambda r: (-r[0], r[1]))

    def fmt(value: Optional[float]) -> str:
        return "-" if value is None else f"{value:.2f}"

    print(f"{len(rows)} CRC melting points differ from NASA-9 or JANAF by more than {args.limit:g} K\n")
    print(f"{'#':>3} {'diff K':>7} {'%':>5}  {'hill':10} {'variant':12} {'CRC':>8} {'NASA-9':>8} "
          f"{'JANAF':>8} {'table':6} line")
    for i, (diff, hill, variant, crc, nasa_value, janaf_value, janaf_id, line) in enumerate(rows, start=1):
        print(f"{i:3} {diff:7.1f} {100 * diff / crc:5.1f}  {hill:10} {variant[:12]:12} {crc:8.2f} "
              f"{fmt(nasa_value):>8} {fmt(janaf_value):>8} {janaf_id or '-':6} {line}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
