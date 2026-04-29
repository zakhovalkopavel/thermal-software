#!/usr/bin/env python3
"""
parse_nasa_thermo.py — CLI entry point: convert NASA thermodynamic databases to JSON.

Sources (shared/sources/NASA/)
-------------------------------
  nasa7-origin.dat  — NASA SP-273 (1971) 7-coefficient format
    origin: https://shepherd.caltech.edu/EDL/PublicResources/sdt/SDToolbox/cti/NASA7/nasa7.dat

  nasa9-origin.dat  — NASA RP-1311 (1996) 9-coefficient format
    origin: https://shepherd.caltech.edu/EDL/PublicResources/sdt/SDToolbox/cti/NASA9/nasa9.dat

  nasa9-new.dat     — Burcat/Ruscic ANL-05/20 (2005, updated 2023)
    origin: https://respecth.elte.hu/burcat/NEWNASA.TXT

Output (shared/processed/)
--------------------------
  nasa7.json  — species map: nasa7: { Tswitch, low:{a1-a7}, high:{a1-a7} }
  nasa9.json  — species map: nasa9: { ranges:[{Tmin,Tmax,H0,coeffs:{a1-a9}}] }

JSON shapes match the TypeScript types Nasa7Equation / Nasa9Equation in
  backend/src/common/thermal/type/

Implementation
--------------
  nasa_thermo.parsers.nasa7  — NASA-7 parser
  nasa_thermo.parsers.nasa9  — NASA-9 parser
  nasa_thermo.writers        — JSON serialisation

Spec
----
  docs/scripts/NASA_THERMO_PARSER_SPEC.md

Refs
----
  docs/REFERENCES.md  [8] NASA7, [9] Burcat2005, [23] NASA9

Usage
-----
  docker compose run --rm python python src/scripts/parse_nasa_thermo.py \\
    --nasa7  shared/sources/NASA/nasa7-origin.dat \\
    --nasa9  shared/sources/NASA/nasa9-origin.dat shared/sources/NASA/nasa9-new.dat \\
    --out-dir shared/processed
"""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path
from typing import Optional

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


def _build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="Parse NASA thermodynamic databases into JSON.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    p.add_argument(
        "--nasa7", metavar="FILE", type=Path,
        help="Path to NASA-7 source file (e.g. shared/sources/NASA/nasa7-origin.dat)",
    )
    p.add_argument(
        "--nasa9", metavar="FILE", nargs="+", type=Path,
        help=(
            "One or more NASA-9 source files, merged in order "
            "(later file wins on duplicate species name)"
        ),
    )
    p.add_argument(
        "--out-dir", metavar="DIR", type=Path, default=Path("shared/processed"),
        help="Output directory (default: shared/processed)",
    )
    p.add_argument(
        "--only-gaseous", action="store_true",
        help="Skip condensed-phase species",
    )
    p.add_argument(
        "--species", metavar="N1,N2,...",
        help="Comma-separated list of species names to extract (default: all)",
    )
    p.add_argument(
        "-v", "--verbose", action="store_true",
        help="Show DEBUG-level messages",
    )
    return p


def main(argv: list[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    if not args.nasa7 and not args.nasa9:
        logger.error("Provide at least one of --nasa7 or --nasa9")
        return 1

    filter_set: Optional[set] = None
    if args.species:
        filter_set = {s.strip() for s in args.species.split(",") if s.strip()}

    # Import here to keep startup fast and errors localised
    from nasa_thermo.parsers.nasa7 import parse_nasa7
    from nasa_thermo.parsers.nasa9 import parse_nasa9
    from nasa_thermo.writers import write_nasa7_json, write_nasa9_json

    exit_code = 0

    if args.nasa7:
        if not args.nasa7.exists():
            logger.error("File not found: %s", args.nasa7)
            return 1
        try:
            species7 = parse_nasa7(
                args.nasa7,
                only_gaseous=args.only_gaseous,
                filter_species=filter_set,
            )
            write_nasa7_json(species7, args.out_dir)
        except Exception as exc:
            logger.error("Fatal error processing NASA-7: %s", exc)
            exit_code = 1

    if args.nasa9:
        missing = [p for p in args.nasa9 if not p.exists()]
        if missing:
            for p in missing:
                logger.error("File not found: %s", p)
            return 1
        try:
            species9 = parse_nasa9(
                args.nasa9,
                only_gaseous=args.only_gaseous,
                filter_species=filter_set,
            )
            write_nasa9_json(species9, args.out_dir)
        except Exception as exc:
            logger.error("Fatal error processing NASA-9: %s", exc)
            exit_code = 1

    return exit_code


if __name__ == "__main__":
    sys.exit(main())

