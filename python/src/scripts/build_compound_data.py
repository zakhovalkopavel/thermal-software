#!/usr/bin/env python3
"""
build_compound_data.py — CLI entry point: merge the CalebBell/chemicals data tables into compound JSON.

Sources (shared/sources/compound-data/chemicals/)
-------------------------------------------------
  chemicals/<repo path>  — CRC, Perry, Poling, Yaws, TRC, Zabransky, WebBook Shomate, VDI PPDS tables
                           and the identifier databases, copied with their repo paths
    origin: https://github.com/CalebBell/chemicals (chemicals/)
  PROVENANCE.txt         — chemicals repository URL and commit of the copy

Sources (shared/sources/compound-data/nist-janaf/)
--------------------------------------------------
  py-janaf/data/<ID>.txt, py-janaf/janaf.json, PROVENANCE.txt — NIST-JANAF tables, parsed with the
                           janaf package; their ids are attached to the records by Hill formula

Sources (shared/sources/NASA/)
------------------------------
  nasa7-origin.dat, nasa9-origin.dat, nasa9-new.dat — NASA-7 / NASA-9 polynomials, parsed with the
                           nasa_thermo package; their species keys are attached to the records by Hill
                           formula and checked by ΔfH°(298.15) (keys of shared/processed/NASA/*.json)

Sources (shared/sources/transport-parameters.json)
--------------------------------------------------
  Hand transcription of White (Viscous Fluid Flow 3e) Tables 1-2, 1-3, A-6, A-7, NASA TN D-481 Table III
  (Stockmayer), Mamedov & Somuncu 2014 Table 1 and Svehla 1995 (NASA TM-4647) Table I:
  power-law / Sutherland equations, σ and ε/k tagged by potential, and Svehla's transport methods
  (the pure species on the records, the pairs in interactions.json)

Sources (shared/sources/compound-data/pubchem/)
-----------------------------------------------
  pubchem-<class>.jsonl  — PubChem answers of the CAS numbers the chemicals identifier files miss (inorganic,
                           organic, unclassified), filled by the second step, fetch_pubchem_identifiers.py
                           (make compound-data-pubchem); the build itself never goes online

Output (shared/processed/compound-data/)
----------------------------------------
  The folder is cleared first (class folders and top-level .json files).
  inorganic/<Element>/<formula>-<name>.json — one file per Hill formula in the main-element folder,
                             named with the IUPAC formula
                             (TiO2 → inorganic/Ti/TiO2-titanium-dioxide.json, NH3 → inorganic/N/NH3-...)
  organic/<family>/<formula>-<name>.json    — one file per compound in its first family folder
                             (ethanol → organic/alcohols/C2H6O-ethanol.json)
  unresolved.json          — source rows whose CAS or formula could not be resolved
  index.json               — every compound with its file, plus byFormula / byElement / byFamily
  units.json               — unit of every property, equation result, Mr and temperature
  sources.json             — repository, commit, license, the file keys used in ref: [RefKey, line, fileKey],
                             the JANAF URL templates and the NASA datasets of the nasa7 / nasa9 keys
  interactions.json        — Svehla 1995 transport data of species pairs (diffusion, ions, electron),
                             with the record ids of both species

Report (tmp/reports/python/compound-data/report.json, /app/reports in the container)
------------------------------------------------------------------------------------
  formula conflicts, Perry rows without a range, VDI liquid rows without Tm/Tc, Zabransky rows
  without CAS, equation sanity issues and one check point per equation
  missing-cas.txt — CAS numbers the chemicals identifier files miss: input of the PubChem step

Implementation
--------------
  compound_data.builder  — all parsers → merge → checks → JANAF table ids → NASA keys
  compound_data.writers  — JSON serialisation, missing-cas.txt

Spec
----
  docs/scripts/COMPOUND_DATA_SPEC.md

Usage
-----
  docker compose run --rm python python src/scripts/build_compound_data.py
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


def _build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="Merge the CalebBell/chemicals data tables into compound JSON files.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    p.add_argument(
        "--source-dir", metavar="DIR", type=Path, default=Path("shared/sources/compound-data/chemicals"),
        help="chemicals copy with PROVENANCE.txt (default: %(default)s)",
    )
    p.add_argument(
        "--janaf-dir", metavar="DIR", type=Path, default=Path("shared/sources/compound-data/nist-janaf"),
        help="NIST-JANAF copy (py-janaf/data, py-janaf/janaf.json, PROVENANCE.txt) (default: %(default)s)",
    )
    p.add_argument("--no-janaf", action="store_true", help="Do not attach JANAF table ids")
    p.add_argument(
        "--nasa-dir", metavar="DIR", type=Path, default=Path("shared/sources/NASA"),
        help="NASA-7 / NASA-9 sources (nasa7-origin.dat, nasa9-origin.dat, nasa9-new.dat) (default: %(default)s)",
    )
    p.add_argument("--no-nasa", action="store_true", help="Do not attach NASA-7 / NASA-9 keys")
    p.add_argument(
        "--pubchem-dir", metavar="DIR", type=Path, default=Path("shared/sources/compound-data/pubchem"),
        help="PubChem files pubchem-<class>.jsonl from fetch_pubchem_identifiers.py (default: %(default)s)",
    )
    p.add_argument("--no-pubchem", action="store_true", help="Do not use the PubChem files")
    p.add_argument(
        "--transport-file", metavar="FILE", type=Path, default=Path("shared/sources/transport-parameters.json"),
        help="Transport parameters (White, TN D-481, Mamedov 2014, Svehla 1995) (default: %(default)s)",
    )
    p.add_argument("--no-transport", action="store_true", help="Do not read the transport parameters")
    p.add_argument(
        "--out-dir", metavar="DIR", type=Path, default=Path("shared/processed/compound-data"),
        help="Output directory (default: %(default)s)",
    )
    p.add_argument(
        "--report-dir", metavar="DIR", type=Path, default=Path("reports/compound-data"),
        help="Report directory (default: %(default)s, i.e. tmp/reports/python/compound-data on the host)",
    )
    p.add_argument("-v", "--verbose", action="store_true", help="Show DEBUG-level messages")
    return p


def main(argv: list[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    if not args.source_dir.is_dir():
        logger.error("Not found: %s", args.source_dir)
        return 1

    from compound_data.builder import build_compound_data
    from compound_data.constants.pubchem_source import MISSING_CAS_FILE
    from compound_data.compound_files import compound_files
    from compound_data.writers import (
        write_compound_index, write_compound_json, write_compound_sources, write_compound_units, write_interactions,
        write_missing_cas, write_unresolved,
    )
    from dataset_layout.clear_dataset_dir import clear_dataset_dir

    try:
        result = build_compound_data(
            args.source_dir, None if args.no_janaf else args.janaf_dir, None if args.no_pubchem else args.pubchem_dir,
            None if args.no_nasa else args.nasa_dir, None if args.no_transport else args.transport_file,
        )
        generated_at = datetime.now(timezone.utc).isoformat()
        files = compound_files(result.merge.records.values())
        clear_dataset_dir(args.out_dir)
        written = write_compound_json(files, args.out_dir)
        write_unresolved(args.out_dir, result.merge.unresolved, generated_at)
        write_compound_index(files, args.out_dir, generated_at)
        write_compound_units(args.out_dir)
        write_compound_sources(args.out_dir, result.chem, generated_at, result.janaf, result.pubchem_tables, result.nasa,
                               result.transport_tables)
        write_interactions(args.out_dir, result.interactions, generated_at)

        args.report_dir.mkdir(parents=True, exist_ok=True)
        report_path = args.report_dir / "report.json"
        report_path.write_text(
            json.dumps({"generatedAt": generated_at, **result.report}, indent=2, ensure_ascii=False, allow_nan=False),
            encoding="utf-8",
        )
        write_missing_cas(args.report_dir / MISSING_CAS_FILE, result.missing_cas, generated_at)
    except Exception as exc:
        logger.exception("Fatal error building compound data: %s", exc)
        return 1

    counts = result.report["counts"]
    logger.info(
        "%d compounds (%d inorganic, %d organic), %d unresolved, in %d compound files → %s; report → %s",
        counts["records"], counts["inorganic"], counts["organic"], counts["unresolved"],
        len(written), args.out_dir, report_path,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
