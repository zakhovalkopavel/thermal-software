"""Join Abu-Eishah pure-metal λ correlations into compound-data element records."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Optional


# Strip orientation / form suffixes from table metal labels.
_SUFFIX = re.compile(
    r",\s*(PC|P|/a/|/b/|/c/|polycrystalline).*$",
    re.I,
)

METAL_TO_ELEMENT: dict[str, str] = {
    "aluminum": "Al",
    "antimony": "Sb",
    "beryllium": "Be",
    "bismuth": "Bi",
    "cadmium": "Cd",
    "chromium": "Cr",
    "cobalt": "Co",
    "copper": "Cu",
    "gallium": "Ga",
    "gold": "Au",
    "hafnium": "Hf",
    "indium": "In",
    "iridium": "Ir",
    "iron": "Fe",
    "lead": "Pb",
    "lithium": "Li",
    "magnesium": "Mg",
    "manganese": "Mn",
    "molybdenum": "Mo",
    "nickel": "Ni",
    "niobium": "Nb",
    "osmium": "Os",
    "palladium": "Pd",
    "platinum": "Pt",
    "plutonium": "Pu",
    "potassium": "K",
    "rhenium": "Re",
    "rhodium": "Rh",
    "silver": "Ag",
    "sodium": "Na",
    "tantalum": "Ta",
    "thorium": "Th",
    "tin": "Sn",
    "titanium": "Ti",
    "tungsten": "W",
    "uranium": "U",
    "vanadium": "V",
    "zinc": "Zn",
    "zirconium": "Zr",
}

# Prefer polycrystalline when several orientations exist.
_PREF = ("pc", "polycrystalline", "")


def _base_metal(label: str) -> str:
    return _SUFFIX.sub("", label).strip()


def _element_for(label: str) -> Optional[str]:
    base = _base_metal(label).lower()
    return METAL_TO_ELEMENT.get(base)


def _orientation_rank(label: str) -> int:
    low = label.lower()
    for i, token in enumerate(_PREF):
        if token and token in low:
            return i
        if token == "" and "," not in label:
            return i
    return len(_PREF)


def load_abu_eishah_rows(raw_dir: Path) -> list[dict[str, Any]]:
    """Collect high-T and near-1.5 Tm fits (tables 2/3), one preferred row per element."""
    by_el: dict[str, dict[str, Any]] = {}
    for fname, table_key in (
        ("thermal_conductivity_metals2.json", "abuEishahHighT"),
        ("thermal_conductivity_metals3.json", "abuEishahNearTm"),
    ):
        path = raw_dir / fname
        if not path.is_file():
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        for row in data.get("data", []):
            label = str(row.get("metal") or "")
            el = _element_for(label)
            if el is None:
                continue
            key = f"{el}:{table_key}"
            cand = {
                "element": el,
                "label": label,
                "tableKey": table_key,
                "sourceFile": fname,
                "a": row["a"],
                "b": row["b"],
                "c": row["c"],
                "d": row["d"],
                "min_K": row.get("temperature_range_K", {}).get("min"),
                "max_K": row.get("temperature_range_K", {}).get("max"),
                "R_squared": row.get("R_squared"),
                "AARE_percent": row.get("AARE_percent"),
                "formula": "k = a * T^b * exp(c*T) * exp(d/T)",
                "unit": "W/(m·K)",
                "_rank": _orientation_rank(label),
            }
            prev = by_el.get(key)
            if prev is None or cand["_rank"] < prev["_rank"]:
                by_el[key] = cand
    rows = []
    for cand in by_el.values():
        cand.pop("_rank", None)
        rows.append(cand)
    rows.sort(key=lambda r: (r["element"], r["tableKey"]))
    return rows


def write_join_source(raw_dir: Path, out_path: Path) -> dict[str, Any]:
    rows = load_abu_eishah_rows(raw_dir)
    payload = {
        "source": "Abu-Eishah 2001 (from shared/sources/metal-data/raw-tables)",
        "ref": "AbuEishah2001",
        "formula": "k = a * T^b * exp(c*T) * exp(d/T)",
        "rows": rows,
    }
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return {"rowCount": len(rows), "path": str(out_path)}


def _find_element_file(compound_dir: Path, element: str) -> Optional[Path]:
    folder = compound_dir / "inorganic" / element
    if not folder.is_dir():
        return None
    matches = sorted(folder.glob(f"{element}-*.json"))
    return matches[0] if matches else None


def join_into_compound_data(
    raw_dir: Path,
    compound_dir: Path,
) -> dict[str, Any]:
    """Append Abu-Eishah solid-λ raw rows onto matching element compound files."""
    rows = load_abu_eishah_rows(raw_dir)
    joined = 0
    missing: list[str] = []
    for row in rows:
        path = _find_element_file(compound_dir, row["element"])
        if path is None:
            missing.append(row["element"])
            continue
        doc = json.loads(path.read_text(encoding="utf-8"))
        entries = doc.get("entries") or {}
        if not entries:
            missing.append(row["element"])
            continue
        # First CAS entry (element compounds have one primary entry)
        cas, entry = next(iter(entries.items()))
        raw_list = entry.setdefault("raw", [])
        # Remove prior Abu-Eishah rows for this tableKey
        raw_list[:] = [
            r
            for r in raw_list
            if not (
                isinstance(r, dict)
                and r.get("property") == "thermalConductivity"
                and r.get("phase") == "solid"
                and isinstance(r.get("values"), dict)
                and r["values"].get("tableKey") == row["tableKey"]
            )
        ]
        raw_list.append(
            {
                "property": "thermalConductivity",
                "phase": "solid",
                "values": {
                    "tableKey": row["tableKey"],
                    "label": row["label"],
                    "formula": row["formula"],
                    "a": row["a"],
                    "b": row["b"],
                    "c": row["c"],
                    "d": row["d"],
                    "min_K": row["min_K"],
                    "max_K": row["max_K"],
                    "R_squared": row["R_squared"],
                    "AARE_percent": row["AARE_percent"],
                    "unit": row["unit"],
                    "sourceFile": row["sourceFile"],
                },
                "ref": ["AbuEishah2001", None, row["tableKey"]],
            }
        )
        path.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        joined += 1
    return {
        "joined": joined,
        "missingElements": sorted(set(missing)),
        "rowCount": len(rows),
    }
