"""Overlay all minerals-thermodynamic datasets into compound-data.

Refs:
  [60] RobieHemingway1995
  [61] HollandPowell2011
  [62] Abdul2023
  [64] Pankratz1982
  [65] Jung2009AlTiO
  [66] Malan2019
  [67] Watanabe2000
  [68] Koroleva2017
  [70] Mao2006

Robie per-phase files are handled by ``usgs_bulletin_2131.compound_data_overlay``.
Every other ``phases.json`` (and Koroleva regressions) is merged here.
Only ``status: ok`` rows with usable numbers are written; idempotent per RefKey.
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
from dataset_layout.compound_file_name import compound_file_name, name_slug
from thermodynamic_staging.compound_data_phase_map import (
    map_phase_to_patches,
    regressions_to_raw,
)
from usgs_bulletin_2131.compound_data_overlay import (
    _find_targets,
    _normalize_formula,
    _pick_entry_key,
    overlay_robie_into_compound_data,
)

# Stubs wrongly named ``<hill>-<source-id>-<phase>.json`` in the first overlay pass.
_LEGACY_STUB_MARKERS = (
    "-holland-powell-ds633-",
    "-malan-2019-",
    "-jung-2009-",
    "-koroleva-2017-",
    "-abdul-2023-",
    "-mao-2006-",
    "-watanabe-2000-",
)

SKIP_SOURCE_IDS = frozenset(
    {
        "robie-hemingway-1995",  # dedicated overlay
        "mao-2005",  # skipped_no_data
        "abdul-2023-ccr",  # tmp cross-check only
    }
)


def _load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _write_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def _has_ref(values: list[Any] | None, ref: str) -> bool:
    if not values:
        return False
    for v in values:
        if not isinstance(v, dict):
            continue
        r = v.get("ref")
        if isinstance(r, list) and r and r[0] == ref:
            return True
        if r == ref:
            return True
    return False


def _apply_patches(entry: dict[str, Any], patches: dict[str, Any], ref: str) -> bool:
    changed = False
    props = entry.setdefault("properties", {})
    for key, items in (patches.get("properties") or {}).items():
        lst = props.get(key)
        if not isinstance(lst, list):
            lst = []
            props[key] = lst
        if _has_ref(lst, ref):
            continue
        for item in items:
            lst.append(item)
            changed = True

    raw_lst = entry.get("raw")
    if not isinstance(raw_lst, list):
        raw_lst = []
        entry["raw"] = raw_lst
    for item in patches.get("raw") or []:
        prop = item.get("property")
        if any(
            isinstance(x, dict) and x.get("property") == prop and _has_ref([x], ref)
            for x in raw_lst
        ):
            continue
        raw_lst.append(item)
        changed = True
    return changed


_OXIDE_TERM = re.compile(r"([A-Za-z][A-Za-z0-9]*)\(([-+]?\d*\.?\d+)\)")


def _expand_oxide_composition(line: str) -> str | None:
    """``Al2O3(1)SiO2(1)`` → IUPAC ``Al2SiO5`` when coefficients are non-negative."""
    matches = list(_OXIDE_TERM.finditer(line))
    if not matches:
        return None
    tot: dict[str, float] = {}
    for m in matches:
        coef = float(m.group(2))
        if coef < 0:
            return None
        try:
            counts = formula_elements(m.group(1))
        except Exception:
            return None
        for el, n in counts.items():
            tot[el] = tot.get(el, 0.0) + float(n) * coef
    if not tot:
        return None
    # Scale half/quarter oxide coeffs to integers (e.g. Al2O3(.5) → ×2).
    scale = 1
    for n in tot.values():
        for s in (1, 2, 4, 8):
            if abs(n * s - round(n * s)) < 1e-6:
                scale = max(scale, s)
                break
        else:
            return None
    ints = {
        el: int(round(n * scale))
        for el, n in tot.items()
        if round(n * scale) > 0
    }
    if not ints:
        return None
    try:
        return iupac_formula(ints)
    except Exception:
        return None


def _display_formula(hill: str, formula_hint: str | None = None) -> str:
    """Readable formula for files: prefer source formula, else IUPAC, else Hill.

    Matches existing compound-data stems (``Fe2TiO5-…``, ``Al2TiO5-…``), not Hill
    (``Fe2O5Ti``) and not oxide-coeff strings (``Al2O3(1)SiO2(1)``).
    """
    if formula_hint and re.fullmatch(r"[A-Za-z][A-Za-z0-9]*", formula_hint):
        return formula_hint
    if formula_hint and "(" in formula_hint:
        expanded = _expand_oxide_composition(re.sub(r"\s+", "", formula_hint))
        if expanded:
            return expanded
    try:
        return iupac_formula(formula_elements(hill))
    except Exception:
        pass
    if formula_hint and "(" not in formula_hint and "-" not in formula_hint:
        return formula_hint
    return re.sub(r"[^A-Za-z0-9]", "", hill) or hill


def _human_name(row: dict[str, Any], phase_id: str) -> str:
    name = row.get("name")
    if isinstance(name, str) and name.strip():
        return name.strip()
    return phase_id.replace("_", " ").replace("-", " ").strip() or phase_id


def _stub_rel_path(group: str, display: str, name: str) -> str:
    """``inorganic/Ti/Fe2TiO5-pseudobrookite.json`` — same convention as compound-data build."""
    safe_display = display.replace("/", "-").replace(" ", "")
    stem = compound_file_name(safe_display, name)
    return f"inorganic/{group}/{stem}.json"


def _formula_candidates(row: dict[str, Any], phase_id: str) -> list[str]:
    out: list[str] = []
    raw = row.get("formula")
    if isinstance(raw, str) and raw.strip():
        cleaned = re.sub(r"\s+", "", raw)
        expanded = _expand_oxide_composition(cleaned)
        if expanded:
            out.append(expanded)
        out.append(cleaned)
        # Dash-separated oxide systems → try first oxide segment for matching.
        if "-" in cleaned:
            for part in cleaned.split("-"):
                if part and re.search(r"[A-Za-z]", part):
                    out.append(part)
    oxide = row.get("oxideCompositionLine")
    if isinstance(oxide, str) and oxide.strip():
        expanded = _expand_oxide_composition(re.sub(r"\s+", "", oxide))
        if expanded:
            out.append(expanded)
    if phase_id and re.fullmatch(r"[A-Za-z][A-Za-z0-9()]+", phase_id):
        out.append(phase_id)
    # de-dupe preserve order
    seen: set[str] = set()
    uniq: list[str] = []
    for f in out:
        if f not in seen:
            seen.add(f)
            uniq.append(f)
    return uniq


def _fallback_norm(formula: str | None, phase_id: str) -> tuple[str, str, list[str]]:
    """Last resort for dash-oxide systems / model phases without a Hill formula."""
    display = (formula or phase_id).strip() or phase_id
    hill = re.sub(r"[^A-Za-z0-9]", "", display) or re.sub(r"[^A-Za-z0-9]", "", phase_id) or "X"
    for el in ("Ti", "Fe", "Al", "Ca", "Na", "K", "Mg", "V", "B", "Li", "Si"):
        if el in display:
            elems = [el]
            if "O" in display:
                elems.append("O")
            return hill, display, elems
    return hill, display, ["Si"]


def _normalize_any(row: dict[str, Any], phase_id: str) -> tuple[str, str, list[str]]:
    hint = row.get("formula") if isinstance(row.get("formula"), str) else None
    for cand in _formula_candidates(row, phase_id):
        norm = _normalize_formula(cand, phase_id)
        if norm:
            hill, _disp, elements = norm
            return hill, _display_formula(hill, hint or cand), elements
        try:
            counts = formula_elements(cand)
        except Exception:
            continue
        if counts:
            hill = hill_formula(counts)
            return hill, _display_formula(hill, hint or cand), sorted(counts)
    return _fallback_norm(hint, phase_id)


def _new_stub(
    hill: str,
    display: str,
    elements: list[str],
    phase_id: str,
    name: str | None,
    patches: dict[str, Any],
    ref: str,
) -> dict[str, Any]:
    group = main_element(elements)
    entry_key = f"{ref.lower()}-{phase_id}".replace(" ", "-")
    entry: dict[str, Any] = {
        "compoundId": phase_id,
        "name": name or phase_id.replace("-", " "),
        "properties": {},
        "equations": {},
        "raw": [],
    }
    _apply_patches(entry, patches, ref)
    return {
        "class": "inorganic",
        "group": group,
        "displayFormula": display,
        "hill": hill,
        "elements": elements,
        "entries": {entry_key: entry},
    }


def _index_add(
    index: dict[str, Any],
    *,
    compound_id: str,
    rel_file: str,
    hill: str,
    display: str,
    entry_key: str,
    name: str,
    group: str,
    ref: str,
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
        "refs": [ref],
        "properties": [],
        "equations": {},
    }
    index.setdefault("byFormula", {}).setdefault(hill, [])
    if compound_id not in index["byFormula"][hill]:
        index["byFormula"][hill].append(compound_id)
    for el in elements_safe(display):
        index.setdefault("byElement", {}).setdefault(el, [])
        if compound_id not in index["byElement"][el]:
            index["byElement"][el].append(compound_id)
    index["count"] = len(compounds)
    index["generatedAt"] = datetime.now(timezone.utc).isoformat()


def elements_safe(display: str) -> list[str]:
    try:
        return sorted(formula_elements(display))
    except Exception:
        return []


def _overlay_phases_dict(
    phases: dict[str, Any],
    *,
    source_id: str,
    source_ref: str,
    convention: str | None,
    compound_data_dir: Path,
    index: dict[str, Any],
    dry_run: bool,
    summary: dict[str, Any],
) -> None:
    for phase_id, row in phases.items():
        if not isinstance(row, dict):
            summary["skippedBad"] += 1
            continue
        if row.get("status") != "ok":
            summary["skippedPartial"] += 1
            continue
        patches = map_phase_to_patches(
            phase_id, row, source_ref=source_ref, convention=convention
        )
        if not patches["properties"] and not patches["raw"]:
            summary["skippedEmpty"] += 1
            continue
        formula_raw = row.get("formula") if isinstance(row.get("formula"), str) else None
        system_formula = bool(formula_raw and formula_raw.count("-") >= 1)
        if system_formula:
            # Multi-oxide system labels must not attach to the first oxide compound.
            hill, display, elements = _fallback_norm(formula_raw, phase_id)
            targets: list[tuple[str, str]] = []
        else:
            hill, display, elements = _normalize_any(row, phase_id)
            name = row.get("name")
            targets = _find_targets(
                index, hill, phase_id, name if isinstance(name, str) else None
            )
        summary["okPhases"] += 1
        name = _human_name(row, phase_id)
        group = main_element(elements)
        stub_rel = _stub_rel_path(group, display, name)
        if not targets:
            cid = name_slug(name) or phase_id
            meta = (index.get("compounds") or {}).get(cid) or (index.get("compounds") or {}).get(
                f"{source_id}-{phase_id}"
            )
            if (compound_data_dir / stub_rel).is_file():
                targets = [(stub_rel, "")]
            elif meta and meta.get("file") and (compound_data_dir / str(meta["file"])).is_file():
                targets = [(str(meta["file"]), str(meta.get("entry") or ""))]

        if not targets:
            stub = _new_stub(hill, display, elements, phase_id, name, patches, source_ref)
            if not dry_run:
                _write_json(compound_data_dir / stub_rel, stub)
                entry_key = next(iter(stub["entries"]))
                _index_add(
                    index,
                    compound_id=name_slug(name) or phase_id,
                    rel_file=stub_rel,
                    hill=hill,
                    display=display,
                    entry_key=entry_key,
                    name=name,
                    group=group,
                    ref=source_ref,
                )
            summary["createdFiles"].append(stub_rel)
            continue

        file_changed = False
        for rel, _hint in targets:
            abs_path = compound_data_dir / rel
            if not abs_path.is_file():
                continue
            data = _load_json(abs_path)
            entries = data.get("entries") or {}
            key = _pick_entry_key(entries, phase_id, name)
            if key is None and entries:
                key = next(iter(entries))
            if key is None:
                continue
            if _apply_patches(entries[key], patches, source_ref):
                file_changed = True
                if not dry_run:
                    _write_json(abs_path, data)
        if file_changed:
            summary["updatedFiles"].append(targets[0][0])
        else:
            summary["unchanged"] += 1


def _overlay_koroleva_regressions(
    dataset: dict[str, Any],
    *,
    compound_data_dir: Path,
    index: dict[str, Any],
    dry_run: bool,
    summary: dict[str, Any],
) -> None:
    regs = dataset.get("regressions")
    if not isinstance(regs, dict) or not regs:
        return
    ref = str(dataset.get("ref") or "Koroleva2017")
    raw_rows = regressions_to_raw(regs, ref=ref)
    patches = {"properties": {}, "equations": {}, "raw": raw_rows}
    hill, display, elements = "O2Si", "SiO2", ["O", "Si"]
    phase_id = "koroleva-regressions"
    reg_name = "silicate and borate regressions"
    rel = _stub_rel_path("Si", display, reg_name)
    abs_path = compound_data_dir / rel
    if abs_path.is_file():
        data = _load_json(abs_path)
        entries = data.get("entries") or {}
        key = next(iter(entries), None)
        if key and _apply_patches(entries[key], patches, ref):
            if not dry_run:
                _write_json(abs_path, data)
            summary["updatedFiles"].append(rel)
        else:
            summary["unchanged"] += 1
        return
    stub = _new_stub(hill, display, elements, phase_id, reg_name, patches, ref)
    if not dry_run:
        _write_json(abs_path, stub)
        _index_add(
            index,
            compound_id="silicate-and-borate-regressions",
            rel_file=rel,
            hill=hill,
            display=display,
            entry_key=next(iter(stub["entries"])),
            name=reg_name,
            group="Si",
            ref=ref,
        )
    summary["createdFiles"].append(rel)
    summary["okPhases"] += 1


def _purge_legacy_stub_names(
    compound_data_dir: Path,
    index: dict[str, Any],
    *,
    dry_run: bool,
) -> list[str]:
    """Remove first-pass stubs named ``…-<source-id>-…`` (not compound-data convention)."""
    removed: list[str] = []
    inorganic = compound_data_dir / "inorganic"
    if not inorganic.is_dir():
        return removed
    for path in inorganic.rglob("*.json"):
        name = path.name
        if not any(m in name for m in _LEGACY_STUB_MARKERS):
            continue
        rel = str(path.relative_to(compound_data_dir))
        removed.append(rel)
        if not dry_run:
            path.unlink(missing_ok=True)
    if not dry_run and removed:
        compounds = index.get("compounds") or {}
        drop = [cid for cid, meta in compounds.items() if meta.get("file") in removed]
        for cid in drop:
            compounds.pop(cid, None)
        # Drop byFormula pointers to removed ids
        for hill, ids in list((index.get("byFormula") or {}).items()):
            index["byFormula"][hill] = [i for i in ids if i not in drop]
        for el, ids in list((index.get("byElement") or {}).items()):
            index["byElement"][el] = [i for i in ids if i not in drop]
        index["count"] = len(compounds)
    return sorted(removed)


def overlay_minerals_thermodynamic(
    staging_root: Path,
    compound_data_dir: Path,
    *,
    dry_run: bool = False,
    include_robie: bool = True,
) -> dict[str, Any]:
    """Overlay Robie + every ``phases.json`` dataset into compound-data."""
    summary: dict[str, Any] = {
        "okPhases": 0,
        "updatedFiles": [],
        "createdFiles": [],
        "skippedNoFormula": [],
        "skippedPartial": 0,
        "skippedEmpty": 0,
        "skippedBad": 0,
        "unchanged": 0,
        "purgedLegacyStubs": [],
        "sources": {},
    }

    index_path = compound_data_dir / "index.json"
    index = _load_json(index_path)
    summary["purgedLegacyStubs"] = _purge_legacy_stub_names(
        compound_data_dir, index, dry_run=dry_run
    )
    if not dry_run and summary["purgedLegacyStubs"]:
        _write_json(index_path, index)

    if include_robie:
        robie_dir = staging_root / "robie-hemingway-1995"
        if robie_dir.is_dir():
            robie_summary = overlay_robie_into_compound_data(
                robie_dir, compound_data_dir, dry_run=dry_run
            )
            summary["sources"]["robie-hemingway-1995"] = robie_summary
            summary["okPhases"] += int(robie_summary.get("okPhases") or 0)
            summary["updatedFiles"].extend(robie_summary.get("updatedFiles") or [])
            summary["createdFiles"].extend(robie_summary.get("createdFiles") or [])
            summary["skippedNoFormula"].extend(robie_summary.get("skippedNoFormula") or [])
            summary["skippedPartial"] += int(robie_summary.get("skippedPartial") or 0)
            summary["unchanged"] += int(robie_summary.get("unchanged") or 0)

    index = _load_json(index_path)

    for child in sorted(staging_root.iterdir()):
        if not child.is_dir() or child.name in SKIP_SOURCE_IDS:
            continue
        phases_path = child / "phases.json"
        if not phases_path.is_file():
            continue
        dataset = _load_json(phases_path)
        if dataset.get("status") in ("skipped_no_data", "partial") and not dataset.get(
            "phases"
        ):
            continue
        source_ref = str(dataset.get("ref") or child.name)
        convention = dataset.get("convention")
        phases = dataset.get("phases") or {}
        before_ok = summary["okPhases"]
        before_created = len(summary["createdFiles"])
        before_updated = len(summary["updatedFiles"])
        _overlay_phases_dict(
            phases,
            source_id=child.name,
            source_ref=source_ref,
            convention=str(convention) if convention else None,
            compound_data_dir=compound_data_dir,
            index=index,
            dry_run=dry_run,
            summary=summary,
        )
        if child.name == "koroleva-2017":
            _overlay_koroleva_regressions(
                dataset,
                compound_data_dir=compound_data_dir,
                index=index,
                dry_run=dry_run,
                summary=summary,
            )
        summary["sources"][child.name] = {
            "okPhases": summary["okPhases"] - before_ok,
            "createdDelta": len(summary["createdFiles"]) - before_created,
            "updatedDelta": len(summary["updatedFiles"]) - before_updated,
            "ref": source_ref,
        }

    if not dry_run:
        _write_json(index_path, index)

    summary["updatedFiles"] = sorted(set(summary["updatedFiles"]))
    summary["createdFiles"] = sorted(set(summary["createdFiles"]))
    return summary
