"""
compound_data.yaws1999_links — Fill / replace compound values from processed Yaws 1999.

Matching rows become ``SourceEntry`` values. For each property/phase on an existing record:

- missing → append (fill)
- existing Yaws-linked value that differs → replace and log
- identical Yaws-linked value → leave as-is

Non-Yaws sources (Perry, Poling, VDI, …) are never replaced.

Also:

- attach Yaws synonym-appendix names onto matching records (``synonyms``);
- create new compound records for validated Yaws CAS that are not yet in the dataset.

Spec: tmp/spec/02_yaws1999_compound_data_update.md
"""
from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Any, Iterable, Optional

from chemical_formula.compound_class import classify_compound
from chemical_formula.formula_elements import formula_elements
from chemical_formula.formula_family import formula_family
from chemical_formula.hill_formula import hill_formula
from chemical_formula.iupac_formula import iupac_formula
from chemical_formula.organic_family import UNCLASSIFIED
from chemicals_tables.equation_value import EquationValue
from chemicals_tables.property_value import PropertyValue
from chemicals_tables.raw_value import RawValue
from chemicals_tables.source_entry import SourceEntry
from chemicals_tables.table_spec import TableSpec
from compound_data.compound_record import CompoundRecord
from compound_data.label_normalize import normalize_label
from compound_data.merger import order_values
from compound_data.parsers.yaws1999_identity import YawsIdentity, YawsIdentityIndex, hill_of
from compound_data.parsers.yaws1999_tables import Yaws1999Tables, parse_yaws1999_tables
from pubchem.cas_number import is_cas
from references import RefKey

_YAWS_REFS = {RefKey.Yaws1999, RefKey.Yaws2014}
_YAWS_KEYS = {"yaws1999Gas"}

# Standard atomic weights (g/mol) for Mr of Yaws-created records that have no identifier MW.
_ATOMIC_WEIGHT: dict[str, float] = {
    "H": 1.00794, "D": 2.0141, "T": 3.01605, "He": 4.0026, "Li": 6.941, "Be": 9.0122,
    "B": 10.811, "C": 12.0107, "N": 14.0067, "O": 15.9994, "F": 18.9984, "Ne": 20.1797,
    "Na": 22.9898, "Mg": 24.305, "Al": 26.9815, "Si": 28.0855, "P": 30.9738, "S": 32.065,
    "Cl": 35.453, "Ar": 39.948, "K": 39.0983, "Ca": 40.078, "Sc": 44.9559, "Ti": 47.867,
    "V": 50.9415, "Cr": 51.9961, "Mn": 54.938, "Fe": 55.845, "Co": 58.9332, "Ni": 58.6934,
    "Cu": 63.546, "Zn": 65.38, "Ga": 69.723, "Ge": 72.64, "As": 74.9216, "Se": 78.96,
    "Br": 79.904, "Kr": 83.798, "Rb": 85.4678, "Sr": 87.62, "Y": 88.9059, "Zr": 91.224,
    "Nb": 92.9064, "Mo": 95.96, "Tc": 98.0, "Ru": 101.07, "Rh": 102.906, "Pd": 106.42,
    "Ag": 107.868, "Cd": 112.411, "In": 114.818, "Sn": 118.71, "Sb": 121.76, "Te": 127.6,
    "I": 126.904, "Xe": 131.293, "Cs": 132.905, "Ba": 137.327, "La": 138.906, "Ce": 140.116,
    "Pr": 140.908, "Nd": 144.242, "Sm": 150.36, "Eu": 151.964, "Gd": 157.25, "Tb": 158.925,
    "Dy": 162.5, "Ho": 164.93, "Er": 167.259, "Tm": 168.934, "Yb": 173.054, "Lu": 174.967,
    "Hf": 178.49, "Ta": 180.948, "W": 183.84, "Re": 186.207, "Os": 190.23, "Ir": 192.217,
    "Pt": 195.084, "Au": 196.967, "Hg": 200.59, "Tl": 204.383, "Pb": 207.2, "Bi": 208.98,
    "Th": 232.038, "U": 238.029,
}


def attach_yaws1999(
    records: Iterable[CompoundRecord],
    processed_dir: Path,
) -> tuple[
    list[dict[str, Any]], list[dict[str, Any]], dict[str, int], list[TableSpec],
    list[dict[str, Any]], list[CompoundRecord], list[dict[str, Any]], list[dict[str, Any]],
]:
    """Apply processed Yaws1999 to ``records``.

    Returns
    ``(issues, replace_log, counts, tables, unmatched, created, issues_log, created_log)``.

    ``created`` are new records that the caller must register in the merge result.
    ``issues_log`` covers table-only CAS (not in appendix) and noRecord attach misses.
    ``created_log`` lists appendix-created compounds for a later PubChem search.
    """
    parsed = parse_yaws1999_tables(processed_dir)
    issues = list(parsed.issues)
    replace_log: list[dict[str, Any]] = []
    issues_log: list[dict[str, Any]] = []
    by_cas: dict[str, CompoundRecord] = {}
    by_hill: dict[str, list[CompoundRecord]] = {}
    for record in records:
        by_cas[record.id] = record
        if record.cas:
            by_cas[record.cas] = record
        by_hill.setdefault(record.hill, []).append(record)

    counts = {
        **parsed.counts,
        "yaws1999Filled": 0,
        "yaws1999Replaced": 0,
        "yaws1999Same": 0,
        "yaws1999NoRecord": 0,
        "yaws1999AmbiguousRecord": 0,
        "yaws1999Created": 0,
        "yaws1999SynonymsAttached": 0,
        "yaws1999TableOnlyCas": 0,
    }

    identity = parsed.identity or YawsIdentityIndex()
    created: list[CompoundRecord] = []

    # Create missing CAS records only from the validated appendix (table-only CAS often
    # carry OCR-corrupted formulas, e.g. exposure-limit rows).
    for cas, ident in sorted(identity.by_cas.items()):
        if cas in by_cas:
            continue
        record = _new_record_from_identity(ident)
        if record is None:
            continue
        _register(record, by_cas, by_hill, created, counts)

    # Synonyms onto every record that matches a Yaws CAS identity.
    for cas, ident in identity.by_cas.items():
        target = by_cas.get(cas)
        if target is None:
            continue
        if _attach_synonyms(target, ident):
            counts["yaws1999SynonymsAttached"] += 1

    # Issue 1: every table row whose printed CAS is not in the appendix.
    table_only = _collect_table_only_cas(processed_dir, identity, by_cas)
    issues_log.extend(table_only)
    counts["yaws1999TableOnlyCas"] = len(table_only)

    for entry in parsed.entries:
        target, miss = _target(entry, by_cas, by_hill)
        if target is None:
            if miss == "ambiguous":
                counts["yaws1999AmbiguousRecord"] += 1
            else:
                counts["yaws1999NoRecord"] += 1
                issues_log.append(_no_record_row(entry, identity))
            continue
        # Prefer a real name when the record was created without one / with a weak label.
        if entry.label and (not target.name or target.name.casefold() == (entry.formula or "").casefold()):
            pretty = _display_name(entry.label)
            if pretty:
                target.name = pretty
        applied = _apply_entry(target, entry, replace_log)
        counts[applied] += 1

    seen: set[int] = set()
    for group in list(by_hill.values()) + [[r] for r in by_cas.values()]:
        for record in group:
            rid = id(record)
            if rid in seen:
                continue
            seen.add(rid)
            order_values(record)

    created_log = [_created_row(record) for record in created]
    return issues, replace_log, counts, parsed.tables, parsed.unmatched, created, issues_log, created_log


def write_yaws1999_jsonl(path: Path, rows: list[dict[str, Any]]) -> Path:
    """Write one JSON object per line (replace / issues / created logs)."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as fh:
        for row in rows:
            fh.write(json.dumps(row, ensure_ascii=False, allow_nan=False) + "\n")
    return path


def write_yaws1999_replace_log(path: Path, rows: list[dict[str, Any]]) -> Path:
    """Back-compat alias for ``write_yaws1999_jsonl``."""
    return write_yaws1999_jsonl(path, rows)


def _register(
    record: CompoundRecord,
    by_cas: dict[str, CompoundRecord],
    by_hill: dict[str, list[CompoundRecord]],
    created: list[CompoundRecord],
    counts: dict[str, int],
) -> None:
    by_cas[record.id] = record
    if record.cas:
        by_cas[record.cas] = record
    by_hill.setdefault(record.hill, []).append(record)
    created.append(record)
    counts["yaws1999Created"] += 1


def _new_record_from_identity(ident: YawsIdentity) -> Optional[CompoundRecord]:
    if not ident.cas or not is_cas(ident.cas):
        return None
    formula = ident.formula or ident.hill
    hill = ident.hill or hill_of(formula)
    if not formula or not hill:
        return None
    try:
        counts = formula_elements(hill)
    except ValueError:
        return None
    return _make_record(ident.cas, formula, hill, counts, ident.name, ident.synonyms)


def _make_record(
    cas: str,
    formula: str,
    hill: str,
    counts: dict[str, float],
    name: Optional[str],
    synonyms: list[str],
) -> CompoundRecord:
    compound_class, group_name = classify_compound(counts, organic=None)
    families: list[str] = []
    if compound_class == "organic":
        family = formula_family(counts)
        families = [family] if family else []
        group_name = families[0] if families else UNCLASSIFIED
    display = hill if compound_class == "organic" else iupac_formula(counts)
    pretty = _display_name(name) if name else None
    record = CompoundRecord(
        id=cas, cas=cas, formula=formula, hill=hill, display_formula=display,
        elements=list(counts), compound_class=compound_class, group=group_name or "unclassified",
        name=pretty, families=families, Mr=_mr_kg_per_mol(counts),
    )
    _attach_synonyms(record, YawsIdentity(cas=cas, name=name or "", formula=formula, hill=hill, synonyms=synonyms))
    return record


def _attach_synonyms(record: CompoundRecord, ident: YawsIdentity) -> bool:
    """Merge Yaws primary name + synonyms into ``record.synonyms``. Returns True when something was added."""
    primary_key = _norm_key(record.name)
    incoming: list[str] = []
    for label in (ident.name, *ident.synonyms):
        pretty = _display_name(label)
        if not pretty:
            continue
        key = _norm_key(pretty)
        if not key or key == primary_key:
            continue
        incoming.append(pretty)
    if not incoming:
        return False
    existing_keys = {_norm_key(s) for s in record.synonyms}
    added = False
    for label in incoming:
        key = _norm_key(label)
        if key in existing_keys:
            continue
        record.synonyms.append(label)
        existing_keys.add(key)
        added = True
    return added


def _display_name(text: Optional[str]) -> Optional[str]:
    if not text:
        return None
    cleaned = normalize_label(str(text)).strip()
    if not cleaned:
        return None
    # Yaws prints ALL CAPS; compound-data names are lowercase.
    if cleaned.isupper():
        return cleaned.casefold()
    return cleaned


def _norm_key(text: Optional[str]) -> str:
    if not text:
        return ""
    return "".join(ch for ch in text.casefold() if ch.isalnum())


def _mr_kg_per_mol(counts: dict[str, float]) -> Optional[float]:
    total = 0.0
    for el, n in counts.items():
        weight = _ATOMIC_WEIGHT.get(el)
        if weight is None:
            return None
        total += weight * float(n)
    return total / 1000.0


def _target(
    entry: SourceEntry,
    by_cas: dict[str, CompoundRecord],
    by_hill: dict[str, list[CompoundRecord]],
) -> tuple[Optional[CompoundRecord], Optional[str]]:
    """Return ``(record, None)`` on hit, or ``(None, "ambiguous"|"noRecord")`` on miss."""
    if entry.cas and entry.cas in by_cas:
        return by_cas[entry.cas], None
    if entry.formula:
        group = by_hill.get(entry.formula, [])
        if len(group) == 1:
            return group[0], None
        if len(group) > 1:
            named = [r for r in group if _names_match(r.name, entry.label) or _synonym_match(r, entry.label)]
            if len(named) == 1:
                return named[0], None
            return None, "ambiguous"
    return None, "noRecord"


def _collect_table_only_cas(
    processed_dir: Path,
    identity: YawsIdentityIndex,
    by_cas: dict[str, CompoundRecord],
) -> list[dict[str, Any]]:
    """Issue 1: rows whose printed CAS is not in the Yaws appendix (formula may be OCR garbage)."""
    index_path = processed_dir / "index.json"
    if not index_path.is_file():
        return []
    index = json.loads(index_path.read_text(encoding="utf-8"))
    out: list[dict[str, Any]] = []
    seen: set[tuple[str, str, Any]] = set()
    for meta in index.get("tables", []):
        table_id = meta.get("id")
        rel = meta.get("file")
        if not table_id or not rel:
            continue
        path = processed_dir / rel
        if not path.is_file():
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        for row in data.get("rows", []):
            cas = row.get("CAS_No") or row.get("cas")
            if not cas:
                continue
            cas_s = str(cas)
            if cas_s in identity.by_cas:
                continue
            key = (cas_s, str(table_id), row.get("id"))
            if key in seen:
                continue
            seen.add(key)
            formula = row.get("formula")
            out.append({
                "kind": "tableOnlyCas",
                "cas": cas_s,
                "casValid": is_cas(cas_s),
                "name": row.get("name"),
                "formula": formula,
                "hill": hill_of(formula) if formula else None,
                "tableId": table_id,
                "rowId": row.get("id"),
                "inAppendix": False,
                "inCompoundData": cas_s in by_cas,
                "note": (
                    "CAS printed on a table row but not in the Yaws appendix; "
                    "formula may be OCR-corrupted — compound not auto-created"
                ),
            })
    return out


def _no_record_row(entry: SourceEntry, identity: YawsIdentityIndex) -> dict[str, Any]:
    """Issue 2: Yaws values matched but no compound-data record to attach to."""
    source = entry.value.source if hasattr(entry.value, "source") else None
    file_key = getattr(source, "key", None) if source else None
    table_id = None
    if isinstance(file_key, str) and file_key.startswith("yaws1999Table"):
        table_id = file_key.removeprefix("yaws1999Table").replace("_", "-", 1)
    cas = entry.cas
    return {
        "kind": "noRecord",
        "cas": cas,
        "casValid": bool(cas and is_cas(cas)),
        "name": entry.label,
        "formula": entry.formula,
        "hill": hill_of(entry.formula) if entry.formula else None,
        "property": entry.property,
        "phase": entry.phase,
        "tableId": table_id,
        "rowId": getattr(source, "line", None) if source else None,
        "fileKey": file_key,
        "inAppendix": bool(cas and cas in identity.by_cas),
        "note": (
            "Yaws property/equation resolved but no compound-data record exists for this CAS/formula; "
            "values were not attached"
        ),
    }


def _created_row(record: CompoundRecord) -> dict[str, Any]:
    """One appendix-created compound for the follow-up PubChem search log."""
    return {
        "cas": record.cas or record.id,
        "name": record.name,
        "formula": record.formula,
        "hill": record.hill,
        "displayFormula": record.display_formula,
        "class": record.compound_class,
        "group": record.group,
        "families": record.families,
        "synonyms": record.synonyms,
        "Mr": record.Mr,
        "source": "yaws1999Appendix",
        "note": "Created from Yaws CAS appendix; run PubChem search to fill identifiers",
    }


def _synonym_match(record: CompoundRecord, label: Optional[str]) -> bool:
    if not label:
        return False
    key = _norm_key(label)
    return any(_norm_key(s) == key for s in record.synonyms)


def _names_match(a: Optional[str], b: Optional[str]) -> bool:
    if not a or not b:
        return False
    return _norm_key(a) == _norm_key(b)


def _apply_entry(record: CompoundRecord, entry: SourceEntry, replace_log: list[dict[str, Any]]) -> str:
    value = entry.value
    if isinstance(value, PropertyValue):
        values = record.properties.setdefault(entry.property, [])
        linked = [(i, v) for i, v in enumerate(values) if _is_yaws_linked(v)]
        if not linked:
            values.append(value)
            return "yaws1999Filled"
        first_i, first = linked[0]
        if _same_property(first, value) and len(linked) == 1:
            return "yaws1999Same"
        reason = _replace_reason(first)
        old = first.to_dict()
        for i, _ in reversed(linked):
            values.pop(i)
        values.insert(min(first_i, len(values)), value)
        replace_log.append(_log_row(record, entry, old, value.to_dict(), reason))
        return "yaws1999Replaced"

    if isinstance(value, EquationValue):
        phase = entry.phase or "none"
        values = record.equations.setdefault(entry.property, {}).setdefault(phase, [])
        linked = [(i, v) for i, v in enumerate(values) if _is_yaws_linked(v)]
        if not linked:
            values.append(value)
            return "yaws1999Filled"
        first_i, first = linked[0]
        if _same_equation(first, value) and len(linked) == 1:
            return "yaws1999Same"
        reason = _replace_reason(first)
        old = first.to_dict()
        for i, _ in reversed(linked):
            values.pop(i)
        values.insert(min(first_i, len(values)), value)
        replace_log.append(_log_row(record, entry, old, value.to_dict(), reason))
        return "yaws1999Replaced"

    if isinstance(value, RawValue):
        values = record.raw
        linked = [
            (i, v) for i, v in enumerate(values)
            if _is_yaws_linked(v) and v.property == value.property and v.phase == value.phase
        ]
        if not linked:
            values.append(value)
            return "yaws1999Filled"
        first_i, first = linked[0]
        if first.values == value.values and len(linked) == 1:
            return "yaws1999Same"
        reason = _replace_reason(first)
        old = first.to_dict()
        for i, _ in reversed(linked):
            values.pop(i)
        values.insert(min(first_i, len(values)), value)
        replace_log.append(_log_row(record, entry, old, value.to_dict(), reason))
        return "yaws1999Replaced"

    return "yaws1999Same"


def _is_yaws_linked(value: Any) -> bool:
    if getattr(value, "ref", None) in _YAWS_REFS:
        return True
    source = getattr(value, "source", None)
    return bool(source and getattr(source, "key", None) in _YAWS_KEYS)


def _replace_reason(old: Any) -> str:
    if getattr(old, "ref", None) == RefKey.Yaws2014:
        return "yaws2014_replaced_by_1999"
    source = getattr(old, "source", None)
    if source and source.key == "yaws1999Gas":
        return "yaws1999Gas_replaced_by_processed"
    return "diff_replace"


def _same_property(a: PropertyValue, b: PropertyValue) -> bool:
    return _close(a.value, b.value) and (a.phase or None) == (b.phase or None)


def _same_equation(a: EquationValue, b: EquationValue) -> bool:
    if a.type != b.type:
        return False
    if not _close(a.min, b.min) or not _close(a.max, b.max) or not _close(a.k, b.k):
        return False
    if set(a.vars) != set(b.vars):
        return False
    return all(_close(a.vars[k], b.vars[k]) for k in a.vars)


def _close(a: Any, b: Any) -> bool:
    if a is None and b is None:
        return True
    if a is None or b is None:
        return False
    try:
        fa, fb = float(a), float(b)
    except (TypeError, ValueError):
        return a == b
    if math.isnan(fa) and math.isnan(fb):
        return True
    return abs(fa - fb) <= 1e-9 * max(1.0, abs(fa), abs(fb))


def _log_row(
    record: CompoundRecord, entry: SourceEntry, old: dict[str, Any], new: dict[str, Any], reason: str,
) -> dict[str, Any]:
    source = entry.value.source if hasattr(entry.value, "source") else None
    file_key = getattr(source, "key", None) if source else None
    table_id = None
    if isinstance(file_key, str) and file_key.startswith("yaws1999Table"):
        table_id = file_key.removeprefix("yaws1999Table").replace("_", "-", 1)
    return {
        "compoundId": record.id,
        "cas": None if record.id.startswith("formula:") else record.id,
        "hill": record.hill,
        "name": record.name,
        "property": entry.property,
        "phase": entry.phase,
        "old": old,
        "new": new,
        "tableId": table_id,
        "rowId": getattr(source, "line", None) if source else None,
        "fileKey": file_key,
        "reason": reason,
    }
