"""Overlay RobieHemingway1995 staging rows into compound-data JSON.

Refs:
  [60] RobieHemingway1995

Only ``status: ok`` phases are written. Idempotent on RobieHemingway1995 refs.
"""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from chemical_formula.formula_elements import formula_elements
from chemical_formula.hill_formula import hill_formula
from chemical_formula.iupac_formula import iupac_formula
from chemical_formula.main_element import main_element
from dataset_layout.compound_file_name import compound_file_name
from usgs_bulletin_2131.mineral_aliases import MINERAL_ALIASES
from usgs_bulletin_2131.write_compound_files import load_robie_phase_rows

REF = "RobieHemingway1995"
KJ_TO_J = 1000.0

_ALIAS_BY_PHASE: dict[str, str] = {
    meta["phaseId"]: meta["formula"]
    for meta in MINERAL_ALIASES.values()
    if "formula" in meta
}


def _load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _write_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def _has_robie_ref(values: list[Any] | None) -> bool:
    if not values:
        return False
    for v in values:
        ref = v.get("ref") if isinstance(v, dict) else None
        if isinstance(ref, list) and ref and ref[0] == REF:
            return True
        if ref == REF:
            return True
    return False


def _prop(value: float, pdf_page: int | None, phase: str = "solid") -> dict[str, Any]:
    ref: list[Any] = [REF]
    if pdf_page is not None:
        ref.append(pdf_page)
    ref.append("usgsBulletin2131")
    return {"value": value, "phase": phase, "ref": ref}


def _cp_equation(phase_row: dict[str, Any]) -> dict[str, Any] | None:
    ranges_in = phase_row.get("cpRanges") or []
    ranges: list[dict[str, Any]] = []
    for r in ranges_in:
        a = r.get("A") or {}
        if a.get("A1") is None or a.get("A2") is None:
            continue
        tmin = r.get("Tmin_K") or 298.0
        tmax = r.get("Tmax_K") or tmin
        ranges.append(
            {
                "Tmin": float(tmin),
                "Tmax": float(tmax),
                "A1": a.get("A1") or 0.0,
                "A2": a.get("A2") or 0.0,
                "A3": a.get("A3") or 0.0,
                "A4": a.get("A4") or 0.0,
                "A5": a.get("A5") or 0.0,
            }
        )
    if not ranges:
        return None
    ranges.sort(key=lambda x: x["Tmin"])
    pdf_page = ranges_in[0].get("pdfPage") if ranges_in else phase_row.get("pdfPage")
    ref: list[Any] = [REF]
    if pdf_page is not None:
        ref.append(pdf_page)
    ref.append("usgsBulletin2131")
    return {
        "type": "robieHemingway",
        "ref": ref,
        "vars": {"ranges": ranges},
        "min": ranges[0]["Tmin"],
        "max": ranges[-1]["Tmax"],
    }


def _try_counts(formula: str) -> dict[str, float] | None:
    try:
        counts = formula_elements(formula)
    except Exception:
        return None
    return counts or None


def _normalize_formula(
    raw: str | None,
    phase_id: str | None = None,
) -> tuple[str, str, list[str]] | None:
    candidates: list[str] = []
    if raw:
        cleaned = re.sub(r"\s+", "", raw)
        candidates.append(cleaned)
        # OCR often uppercases two-letter elements: ALO(OH) → try AlO(OH) via alias.
        if phase_id and phase_id in _ALIAS_BY_PHASE:
            candidates.append(_ALIAS_BY_PHASE[phase_id])
        # Soften all-caps oxide tokens: KALSI2O6-like → leave to alias.
    elif phase_id and phase_id in _ALIAS_BY_PHASE:
        candidates.append(_ALIAS_BY_PHASE[phase_id])
    for cand in candidates:
        counts = _try_counts(cand)
        if counts:
            hill = hill_formula(counts)
            return hill, cand, sorted(counts)
    return None


def _pick_entry_key(
    entries: dict[str, Any],
    phase_id: str,
    name: str | None,
) -> str | None:
    if not entries:
        return None
    phase_l = phase_id.lower().replace("-", " ")
    name_l = (name or "").lower()
    scored: list[tuple[int, str]] = []
    for key, entry in entries.items():
        score = 0
        cid = str(entry.get("compoundId") or "").lower().replace("_", " ").replace("-", " ")
        ename = str(entry.get("name") or "").lower()
        syns = " ".join(str(s).lower() for s in entry.get("synonyms") or [])
        blob = f"{cid} {ename} {syns}"
        if phase_l and phase_l in blob:
            score += 10
        if name_l and name_l in blob:
            score += 5
        props = entry.get("properties") or {}
        if props.get("enthalpyFormation298"):
            score += 1
        scored.append((score, key))
    scored.sort(key=lambda x: (-x[0], x[1]))
    return scored[0][1]


def _find_targets(
    index: dict[str, Any],
    hill: str,
    phase_id: str,
    name: str | None,
) -> list[tuple[str, str]]:
    """Return list of (relative file, entry key)."""
    out: list[tuple[str, str]] = []
    by_formula = index.get("byFormula") or {}
    compound_ids = list(by_formula.get(hill) or [])
    # Also match displayFormula via compounds scan when byFormula empty for this hill.
    if not compound_ids:
        for cid, meta in (index.get("compounds") or {}).items():
            if meta.get("hill") == hill or meta.get("displayFormula") == hill:
                compound_ids.append(cid)
    files_seen: set[str] = set()
    compounds = index.get("compounds") or {}
    for cid in compound_ids:
        meta = compounds.get(cid) or {}
        rel = meta.get("file")
        if not rel or rel in files_seen:
            continue
        files_seen.add(rel)
        out.append((rel, str(meta.get("entry") or "")))
    # Prefer name/phase match among candidates — resolve entry keys later when file loaded.
    _ = (phase_id, name)
    return out


def _ensure_prop_list(props: dict[str, Any], key: str) -> list[Any]:
    cur = props.get(key)
    if not isinstance(cur, list):
        cur = []
        props[key] = cur
    return cur


def _append_phase_data(entry: dict[str, Any], phase_row: dict[str, Any]) -> bool:
    """Mutate entry; return True if anything changed."""
    changed = False
    props = entry.setdefault("properties", {})
    pdf = phase_row.get("pdfPage")
    if phase_row.get("Hf298_kJmol") is not None:
        lst = _ensure_prop_list(props, "enthalpyFormation298")
        if not _has_robie_ref(lst):
            lst.append(_prop(float(phase_row["Hf298_kJmol"]) * KJ_TO_J, pdf))
            changed = True
    if phase_row.get("S298_JmolK") is not None:
        lst = _ensure_prop_list(props, "entropy298")
        if not _has_robie_ref(lst):
            lst.append(_prop(float(phase_row["S298_JmolK"]), pdf))
            changed = True
    if phase_row.get("Gf298_kJmol") is not None:
        lst = _ensure_prop_list(props, "gibbsEnergy298")
        if not _has_robie_ref(lst):
            lst.append(_prop(float(phase_row["Gf298_kJmol"]) * KJ_TO_J, pdf))
            changed = True
    eq = _cp_equation(phase_row)
    if eq:
        equations = entry.setdefault("equations", {})
        hc = equations.setdefault("heatCapacity", {})
        solid = hc.setdefault("solid", {"def": 0, "values": []})
        values = solid.setdefault("values", [])
        if not _has_robie_ref(values):
            values.append(eq)
            changed = True
    return changed


def _new_stub(
    hill: str,
    display: str,
    elements: list[str],
    phase_id: str,
    name: str | None,
    phase_row: dict[str, Any],
) -> dict[str, Any]:
    group = main_element(elements)
    entry_key = f"robie-{phase_id}"
    entry: dict[str, Any] = {
        "compoundId": phase_id,
        "name": name or phase_id.replace("-", " "),
        "Mr": phase_row.get("formulaWeight"),
        "properties": {},
        "equations": {},
    }
    _append_phase_data(entry, phase_row)
    return {
        "class": "inorganic",
        "group": group,
        "displayFormula": display,
        "hill": hill,
        "elements": elements,
        "entries": {entry_key: entry},
    }


def _index_add_compound(
    index: dict[str, Any],
    *,
    compound_id: str,
    rel_file: str,
    hill: str,
    display: str,
    entry_key: str,
    name: str,
    group: str,
) -> None:
    compounds = index.setdefault("compounds", {})
    compounds[compound_id] = {
        "compoundId": compound_id,
        "file": rel_file,
        "hill": hill,
        "displayFormula": display,
        "entry": entry_key,
        "name": name,
        "class": "inorganic",
        "group": group,
        "refs": [REF],
        "properties": [
            "enthalpyFormation298",
            "entropy298",
            "gibbsEnergy298",
        ],
        "equations": {"heatCapacity": ["solid"]},
    }
    index.setdefault("byFormula", {}).setdefault(hill, [])
    if compound_id not in index["byFormula"][hill]:
        index["byFormula"][hill].append(compound_id)
    for el in formula_elements(display):
        index.setdefault("byElement", {}).setdefault(el, [])
        if compound_id not in index["byElement"][el]:
            index["byElement"][el].append(compound_id)
    index["count"] = len(compounds)
    eq_types = index.setdefault("equationTypes", {})
    eq_types["robieHemingway"] = "implemented"
    index["generatedAt"] = datetime.now(timezone.utc).isoformat()


def overlay_robie_into_compound_data(
    staging_path: Path,
    compound_data_dir: Path,
    *,
    dry_run: bool = False,
) -> dict[str, Any]:
    """Merge status=ok staging phases into compound-data; return summary.

    ``staging_path`` may be the Robie staging directory (``<phaseId>.json`` files)
    or a legacy compact ``phases.json``.
    """
    phases = load_robie_phase_rows(staging_path)
    index_path = compound_data_dir / "index.json"
    index = _load_json(index_path)
    summary: dict[str, Any] = {
        "okPhases": 0,
        "updatedFiles": [],
        "createdFiles": [],
        "skippedNoFormula": [],
        "skippedPartial": 0,
        "unchanged": 0,
    }
    for phase_id, row in phases.items():
        if row.get("status") != "ok":
            summary["skippedPartial"] += 1
            continue
        summary["okPhases"] += 1
        norm = _normalize_formula(row.get("formula"), phase_id)
        if not norm:
            summary["skippedNoFormula"].append(phase_id)
            continue
        hill, display, elements = norm
        targets = _find_targets(index, hill, phase_id, row.get("name"))
        if not targets:
            # Create stub mineral file: ``<displayFormula>-<name-slug>.json``.
            group = main_element(elements)
            try:
                display_iupac = iupac_formula(formula_elements(hill))
            except Exception:
                display_iupac = display
            mineral_name = row.get("name") or phase_id.replace("-", " ")
            stem = compound_file_name(display_iupac.replace("/", "-"), mineral_name)
            rel = f"inorganic/{group}/{stem}.json"
            abs_path = compound_data_dir / rel
            stub = _new_stub(hill, display_iupac, elements, phase_id, row.get("name"), row)
            if not dry_run:
                _write_json(abs_path, stub)
                entry_key = next(iter(stub["entries"]))
                _index_add_compound(
                    index,
                    compound_id=phase_id,
                    rel_file=rel,
                    hill=hill,
                    display=display,
                    entry_key=entry_key,
                    name=str(row.get("name") or phase_id),
                    group=group,
                )
            summary["createdFiles"].append(rel)
            continue

        file_changed = False
        for rel, _hint_entry in targets:
            abs_path = compound_data_dir / rel
            if not abs_path.is_file():
                continue
            data = _load_json(abs_path)
            entries = data.get("entries") or {}
            key = _pick_entry_key(entries, phase_id, row.get("name"))
            if key is None:
                continue
            if _append_phase_data(entries[key], row):
                file_changed = True
                if not dry_run:
                    _write_json(abs_path, data)
        if file_changed:
            summary["updatedFiles"].append(targets[0][0])
            eq_types = index.setdefault("equationTypes", {})
            eq_types["robieHemingway"] = "implemented"
        else:
            summary["unchanged"] += 1

    if not dry_run:
        _write_json(index_path, index)
    summary["updatedFiles"] = sorted(set(summary["updatedFiles"]))
    summary["createdFiles"] = sorted(set(summary["createdFiles"]))
    return summary
