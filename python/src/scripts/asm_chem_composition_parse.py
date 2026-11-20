#!/usr/bin/env python3
"""Parse Surya dumps → new metal-data raw-tables composition JSON files + coverage report."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

from metal_data.asm_chem_composition import default_report_dir
from metal_data.asm_chem_parse import (
    load_surya_texts,
    parse_former_sae_pages,
    parse_obsolete_tool_pages,
    parse_stainless_pages,
    parse_tool_steel_pages,
    write_raw_table,
)


def _repo_root() -> Path:
    here = Path(__file__).resolve()
    for parent in here.parents:
        if (parent / "shared").is_dir() and (
            (parent / "python").is_dir() or parent.name == "app"
        ):
            return parent
    return Path("/app")


def main(argv: list[str] | None = None) -> int:
    root = _repo_root()
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--report-dir", type=Path, default=default_report_dir(root))
    parser.add_argument(
        "--raw-dir",
        type=Path,
        default=root / "shared/sources/metal-data/raw-tables",
    )
    parser.add_argument(
        "--alloys-index",
        type=Path,
        default=root / "shared/processed/metal-data/index.json",
    )
    args = parser.parse_args(argv)

    surya = args.report_dir / "surya"
    raw = args.raw_dir
    written: dict[str, int] = {}

    # Tool steels
    tool_pages = [40, 41, 42, 43, 44]
    tool_rows = parse_tool_steel_pages(load_surya_texts(surya, tool_pages))
    write_raw_table(
        raw / "tool_steel_composition.json",
        table_title="Table 1 Composition limits of principal types of tool steels",
        table_subtitle="Wrought tool steels — AISI / UNS composition limits",
        printed_pages={"start": 1166, "end": 1170},
        pdf_pages={"start": 40, "end": 44},
        data=tool_rows,
    )
    written["tool_steel_composition.json"] = len(tool_rows)

    # Obsolete tool
    obs_rows = parse_obsolete_tool_pages(load_surya_texts(surya, [45]))
    write_raw_table(
        raw / "tool_steel_composition_obsolete.json",
        table_title="Table 3 Compositions of tool steels no longer in common use",
        printed_pages={"start": 1171, "end": 1171},
        pdf_pages={"start": 45, "end": 45},
        data=obs_rows,
    )
    written["tool_steel_composition_obsolete.json"] = len(obs_rows)

    # Stainless / heat-resistant wrought
    ss_rows = parse_stainless_pages(load_surya_texts(surya, [48, 49, 50]))
    write_raw_table(
        raw / "stainless_heat_resistant_composition.json",
        table_title="Table 1 Nominal compositions of wrought iron-base heat-resistant alloys",
        table_subtitle="Elevated-temperature / heat-resistant wrought stainless steels",
        printed_pages={"start": 1443, "end": 1445},
        pdf_pages={"start": 48, "end": 50},
        data=ss_rows,
    )
    written["stainless_heat_resistant_composition.json"] = len(ss_rows)

    # Former SAE
    former_pages = [9, 10, 11, 12, 13, 14]
    former_rows = parse_former_sae_pages(load_surya_texts(surya, former_pages))
    write_raw_table(
        raw / "former_sae_steel_composition.json",
        table_title="Table 22 Composition ranges and limits for former standard SAE steels",
        printed_pages={"start": 257, "end": 262},
        pdf_pages={"start": 9, "end": 14},
        data=former_rows,
        notes=[
            "OCR via page-ocr (Surya); former/obsolete SAE grades with obsolescence year when printed.",
            "Useful for orphan property-only SAE ids missing from active composition tables.",
        ],
    )
    written["former_sae_steel_composition.json"] = len(former_rows)

    # Coverage vs current processed steels missing composition
    coverage = _coverage_report(args.alloys_index, raw, written)
    cov_path = args.report_dir / "composition-gap-fill.json"
    # Also copy under tmp/reports host path style
    cov_path.write_text(json.dumps(coverage, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    host_cov = root / "tmp/reports/python/metal-data/composition-gap-fill.json"
    if root.name != "app":
        host_cov.parent.mkdir(parents=True, exist_ok=True)
        host_cov.write_text(json.dumps(coverage, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(json.dumps({"written": written, "coverage": coverage["summary"]}, indent=2))
    return 0


def _coverage_report(index_path: Path, raw_dir: Path, written: dict[str, int]) -> dict:
    idx = json.loads(index_path.read_text(encoding="utf-8")) if index_path.is_file() else {"materials": {}}
    alloys_root = index_path.parent

    # Build lookup sets from new raw files
    tool = json.loads((raw_dir / "tool_steel_composition.json").read_text(encoding="utf-8"))
    tool_obs = json.loads((raw_dir / "tool_steel_composition_obsolete.json").read_text(encoding="utf-8"))
    ss = json.loads((raw_dir / "stainless_heat_resistant_composition.json").read_text(encoding="utf-8"))
    former = json.loads((raw_dir / "former_sae_steel_composition.json").read_text(encoding="utf-8"))

    def _norm(s: str) -> str:
        return re.sub(r"[^A-Z0-9]+", "", str(s).upper())

    tool_types = {_norm(r.get("type", "")) for r in tool["data"]}
    tool_types |= {_norm(r.get("type", "")) for r in tool_obs["data"]}
    tool_uns = {str(r.get("uns_number", "")).upper() for r in tool["data"] if r.get("uns_number")}
    ss_uns = {str(r.get("uns_number", "")).upper() for r in ss["data"] if r.get("uns_number")}
    ss_types = {_norm(r.get("type", "")) for r in ss["data"]}
    former_sae = {str(r.get("sae_isi_number", "")).upper() for r in former["data"]}

    missing_before: list[dict] = []
    still_missing: list[dict] = []
    covered: list[dict] = []

    for mid, meta in idx.get("materials", {}).items():
        if meta.get("group") != "steel":
            continue
        path = alloys_root / meta["path"]
        doc = json.loads(path.read_text(encoding="utf-8"))
        if doc.get("composition"):
            continue
        fam = meta.get("family")
        aliases = doc.get("aliases") or {}
        sae = str(aliases.get("sae") or "").upper()
        uns = str(aliases.get("uns") or "").upper()
        name = str(doc.get("name") or "")
        name_n = _norm(name)
        sae_n = _norm(sae)
        entry = {"materialId": mid, "family": fam, "sae": sae, "uns": uns, "name": doc.get("name")}
        missing_before.append(entry)

        hit = None
        if uns and uns in tool_uns:
            hit = "tool_steel_composition.json"
        elif name_n in tool_types or sae_n in tool_types:
            hit = "tool_steel_composition.json"
        elif uns and uns in ss_uns:
            hit = "stainless_heat_resistant_composition.json"
        elif name_n in ss_types or sae_n in ss_types:
            hit = "stainless_heat_resistant_composition.json"
        elif sae and sae in former_sae:
            hit = "former_sae_steel_composition.json"
        elif re.fullmatch(r"\d{2}B\d{2}", sae):
            hit = None
            entry["note"] = (
                "Boron SAE grade (letter B); not a separate composition row in this PDF — "
                "use base grade chemistry + 0.0005–0.003% B per ASM carbon-steel notes"
            )

        if hit:
            entry["coveredBy"] = hit
            covered.append(entry)
        else:
            still_missing.append(entry)

    by_fam: dict[str, dict[str, int]] = {}
    for e in missing_before:
        fam = e.get("family") or "_"
        by_fam.setdefault(fam, {"missingBefore": 0, "covered": 0, "stillMissing": 0})
        by_fam[fam]["missingBefore"] += 1
    for e in covered:
        fam = e.get("family") or "_"
        by_fam.setdefault(fam, {"missingBefore": 0, "covered": 0, "stillMissing": 0})
        by_fam[fam]["covered"] += 1
    for e in still_missing:
        fam = e.get("family") or "_"
        by_fam.setdefault(fam, {"missingBefore": 0, "covered": 0, "stillMissing": 0})
        by_fam[fam]["stillMissing"] += 1

    return {
        "summary": {
            "newRawFiles": written,
            "steelsMissingCompositionBefore": len(missing_before),
            "coveredByNewTables": len(covered),
            "stillMissing": len(still_missing),
            "byFamily": by_fam,
        },
        "residuals": {
            "aciCastHeatResistant": {
                "reason": "ACI HA–HX cast chemistry not in this PDF",
                "count": sum(1 for e in still_missing if e.get("family") == "heat-resistant"),
            },
            "stillMissingIds": still_missing,
        },
        "covered": covered,
        "note": "Processed alloys under shared/processed/metal-data were NOT rebuilt; join these raw tables in a later metal-data-build.",
    }


if __name__ == "__main__":
    sys.exit(main())
