"""Write one JSON file per Robie phase with all OCR-derived fields.

Refs:
  [60] RobieHemingway1995

Processed layout: ``minerals-thermodynamic/robie-hemingway-1995/<phaseId>.json``
(no compact ``phases.json``, no ``compounds/`` subfolder).
"""

from __future__ import annotations

import json
import shutil
from pathlib import Path
from typing import Any


def clear_robie_staging_dir(out_dir: Path) -> None:
    """Remove prior Robie staging outputs (root ``*.json``, legacy ``compounds/``)."""
    if out_dir.is_dir():
        legacy = out_dir / "compounds"
        if legacy.is_dir():
            shutil.rmtree(legacy)
        for path in out_dir.glob("*.json"):
            path.unlink()
    out_dir.mkdir(parents=True, exist_ok=True)


def write_compound_files(
    phases: dict[str, Any],
    out_dir: Path,
) -> dict[str, Any]:
    """Write ``<phaseId>.json`` for every phase into ``out_dir``; return summary."""
    out_dir.mkdir(parents=True, exist_ok=True)
    written: list[str] = []
    for phase_id, row in sorted(phases.items()):
        path = out_dir / f"{phase_id}.json"
        payload = {
            "source": "RobieHemingway1995",
            "ref": "RobieHemingway1995",
            "convention": row.get("convention", "formation_298"),
            "phaseId": phase_id,
            "name": row.get("name"),
            "formula": row.get("formula"),
            "status": row.get("status"),
            "table298": {
                k: row[k]
                for k in (
                    "formulaWeight",
                    "S298_JmolK",
                    "V298_cm3mol",
                    "Hf298_kJmol",
                    "Gf298_kJmol",
                    "logK298",
                    "uncertainty",
                    "pdfPage",
                    "textSource",
                )
                if k in row
            },
            "cpRanges": row.get("cpRanges") or [],
            "highT": row.get("highT"),
            "ocrPages": _ocr_pages(row),
        }
        path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
        written.append(phase_id)
    return {
        "nFiles": len(written),
        "outDir": str(out_dir),
        "withHighT": sum(
            1 for p in phases.values() if (p.get("highT") or {}).get("rows")
        ),
        "ok": sum(1 for p in phases.values() if p.get("status") == "ok"),
    }


def flatten_compound_doc(doc: dict[str, Any]) -> dict[str, Any]:
    """Flatten per-phase staging JSON into the overlay phase-row shape."""
    row = {
        "phaseId": doc.get("phaseId"),
        "name": doc.get("name"),
        "formula": doc.get("formula"),
        "status": doc.get("status"),
        "convention": doc.get("convention", "formation_298"),
        "cpRanges": doc.get("cpRanges") or [],
        "highT": doc.get("highT"),
        "ocrPages": doc.get("ocrPages") or [],
    }
    table = doc.get("table298") or {}
    if isinstance(table, dict):
        row.update(table)
    return row


def load_robie_phase_rows(staging: Path) -> dict[str, Any]:
    """Load phases from a staging directory of ``<phaseId>.json`` or legacy ``phases.json``."""
    if staging.is_dir():
        phases: dict[str, Any] = {}
        for path in sorted(staging.glob("*.json")):
            if path.name.startswith("_") or path.name == "phases.json":
                continue
            doc = json.loads(path.read_text(encoding="utf-8"))
            if not isinstance(doc, dict) or "phaseId" not in doc:
                continue
            phase_id = str(doc.get("phaseId") or path.stem)
            phases[phase_id] = flatten_compound_doc(doc)
        return phases
    data = json.loads(staging.read_text(encoding="utf-8"))
    if isinstance(data, dict) and isinstance(data.get("phases"), dict):
        return data["phases"]
    if isinstance(data, dict) and data.get("phaseId"):
        pid = str(data["phaseId"])
        return {pid: flatten_compound_doc(data)}
    return {}


def _ocr_pages(row: dict[str, Any]) -> list[int]:
    pages: set[int] = set()
    if row.get("pdfPage") is not None:
        pages.add(int(row["pdfPage"]))
    for r in row.get("cpRanges") or []:
        if r.get("pdfPage") is not None:
            pages.add(int(r["pdfPage"]))
    ht = row.get("highT") or {}
    for p in ht.get("pdfPages") or []:
        pages.add(int(p))
    return sorted(pages)
