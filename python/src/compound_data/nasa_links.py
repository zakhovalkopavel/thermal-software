"""
compound_data.nasa_links — Attach NASA-7 / NASA-9 species keys to the merged records.

Each species is matched by the Hill formula of its element slots, then checked by ΔfH°(298.15):
the polynomial enthalpy at 298.15 K (gas, liquid ``(L)`` or solid phase) against the record's
``enthalpyFormation298`` of that phase (any value of the record). Records named as deuterated
(``methanol-d3``) are not candidates: the chemicals formulas of some of them have H for D.

1. Name: a key suffix (``C4H10,isobutane``, ``C8H10,ethylbenz``) narrows the candidates to the records
   whose name or source labels match it (equal, or starting with a suffix of 4+ characters).
2. ΔfH° within ``HF_TOLERANCE``: one agreeing candidate is linked; several are linked only when they
   are all inorganic (one compound under two CAS), else the species is reported ambiguous.
3. ΔfH° within ``HF_TOLERANCE_SINGLE``: the closest candidate is linked when the candidates are inorganic
   or there is only one (older NASA-7 / CRC values differ by up to ~20 kJ/mol).
4. No ΔfH° to compare (the record has none for the phase, or 298.15 K is outside the fit): inorganic
   candidates are linked when the key is not a numbered duplicate (``N2O4#2``); an organic one only when it
   is the single name match or the single record of the formula. A contradicting ΔfH° is never linked.

Ions, the electron, D/T species and fractional formulas (``Air``) are skipped. The merged NASA-9 file
lets ``nasa9-new.dat`` replace ``nasa9-origin.dat`` keys (``CO2`` is not carbon dioxide there); the
ΔfH° check keeps such keys off the records and reports them.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
Refs: docs/REFERENCES.md  [8] NASA7, [23] NASA9
"""
from __future__ import annotations

import math
import re
from dataclasses import dataclass
from typing import Any, Iterable, Optional

from chemical_formula.formula_elements import ISOTOPES
from chemical_formula.hill_formula import hill_formula
from chemicals_tables.constants.gas_constant import GAS_CONSTANT
from chemicals_tables.report_issue import report_issue
from compound_data.compound_record import CompoundRecord
from compound_data.constants.nasa_source import HF_TOLERANCE, HF_TOLERANCE_SINGLE
from nasa_thermo.nasa7_species import Nasa7Species
from nasa_thermo.nasa9_species import Nasa9Species

T_REF = 298.15
DATASET_TABLES = {"nasa7": "NASA-7", "nasa9": "NASA-9"}

_DUPLICATE = re.compile(r"#\d+$")
_TRAILING_PHASE = re.compile(r"\([^()]*\)$")
_DEUTERATED = re.compile(r"-d\d*\b|deuter", re.IGNORECASE)


@dataclass(frozen=True)
class NasaSpecies:
    """One species of a NASA file, reduced to what the matching needs."""

    key: str
    elements: dict[str, float]
    phase: str                # gas | liquid | solid
    h298: Optional[float]     # [J/mol] H°(298.15) of the fit = ΔfH°(298.15); None when 298.15 K is outside it


def nasa7_species(species: dict[str, Nasa7Species]) -> list[NasaSpecies]:
    out = []
    for key, sp in species.items():
        phase = "gas" if sp.phase == "G" else _condensed_phase(key)
        out.append(NasaSpecies(key, sp.elements, phase, _nasa7_h298(sp)))
    return out


def nasa9_species(species: dict[str, Nasa9Species]) -> list[NasaSpecies]:
    out = []
    for key, sp in species.items():
        phase = "gas" if sp.phase == "gas" else _condensed_phase(key)
        out.append(NasaSpecies(key, sp.elements, phase, _nasa9_h298(sp)))
    return out


def attach_nasa(
    records: dict[str, CompoundRecord], dataset: str, species: Iterable[NasaSpecies],
    tolerance: float = HF_TOLERANCE, tolerance_single: float = HF_TOLERANCE_SINGLE,
) -> tuple[list[dict[str, Any]], dict[str, int]]:
    """Add the keys of ``species`` to ``record.<dataset>`` (``nasa7`` or ``nasa9``); returns report issues and counts."""
    table = DATASET_TABLES[dataset]
    by_hill: dict[str, list[CompoundRecord]] = {}
    for record in records.values():
        if not (record.name and _DEUTERATED.search(record.name)):
            by_hill.setdefault(record.hill, []).append(record)
    names: dict[str, set[str]] = {}
    issues: list[dict[str, Any]] = []
    counts = {"Species": 0, "Skipped": 0, "Linked": 0, "LinkedUnchecked": 0}

    for sp in species:
        counts["Species"] += 1
        hill = _hill(sp)
        if hill is None:
            counts["Skipped"] += 1
            continue
        candidates = by_hill.get(hill, [])
        if not candidates:
            issues.append(_issue(f"{dataset}NoRecord", table, sp, formula=hill))
            continue
        linked, checked, kind, extra = _choose(sp, candidates, names, tolerance, tolerance_single)
        if kind is not None:
            issues.append(_issue(f"{dataset}{kind}", table, sp, formula=hill, **extra))
            continue
        for record in linked:
            keys = getattr(record, dataset)
            if sp.key not in keys:
                keys.append(sp.key)
                keys.sort()
        counts["Linked"] += 1
        counts["LinkedUnchecked"] += 0 if checked else 1

    counts["Records"] = sum(1 for r in records.values() if getattr(r, dataset))
    return issues, {f"{dataset}{name}": value for name, value in counts.items()}


def _choose(
    sp: NasaSpecies, candidates: list[CompoundRecord], names: dict[str, set[str]], tolerance: float,
    tolerance_single: float,
) -> tuple[list[CompoundRecord], bool, Optional[str], dict[str, Any]]:
    """(records to link, ΔfH°-checked, report kind or None, report fields)."""
    numbered = bool(_DUPLICATE.search(sp.key))
    suffix = _suffix(sp.key)
    named = [r for r in candidates if suffix and _name_matches(suffix, _record_names(r, names))]
    pool = named or candidates
    agree, unknown, contradicted, near = [], [], {}, []
    for record in pool:
        values = [v.value for v in record.properties.get("enthalpyFormation298", []) if v.phase == sp.phase]
        if sp.h298 is None or not values:
            unknown.append(record)
            continue
        delta = min(abs(v - sp.h298) for v in values)
        if delta <= tolerance:
            agree.append(record)
        else:
            contradicted[record.id] = values
            if delta <= tolerance_single:
                near.append((delta, record.id, record))
    inorganic = all(r.compound_class == "inorganic" for r in pool)

    if agree:
        if len(agree) == 1 or inorganic:
            return agree + (unknown if inorganic and not numbered else []), True, None, {}
        return [], True, "Ambiguous", {"ids": sorted(r.id for r in agree), "nasaHf298": _round(sp.h298)}
    if near and (inorganic or len(pool) == 1):
        return [min(near)[2]], True, None, {}
    if contradicted:
        return [], True, "HfMismatch", {"nasaHf298": _round(sp.h298), "recordHf298": contradicted}
    if not numbered and (inorganic or (len(pool) == 1 and (named or len(candidates) == 1))):
        return unknown, False, None, {}
    return [], False, "Unchecked", {"ids": sorted(r.id for r in pool)}


def _hill(sp: NasaSpecies) -> Optional[str]:
    """Hill formula, or None for ions, the electron, D/T species, fractional and unparsed formulas."""
    base = _DUPLICATE.sub("", sp.key).split(",", 1)[0]
    if not sp.elements or not all(s.isalpha() for s in sp.elements) or base.endswith(("+", "-")) or "E" in sp.elements:
        return None
    if any(s in ISOTOPES for s in sp.elements) or any(c != int(c) for c in sp.elements.values()):
        return None
    return hill_formula(sp.elements)


def _suffix(key: str) -> Optional[str]:
    """Normalised name after the comma: ``C4H10,n-butane`` → ``butane``."""
    parts = _DUPLICATE.sub("", key).split(",", 1)
    return _normalise(parts[1]) if len(parts) == 2 and _normalise(parts[1]) else None


def _normalise(name: str) -> str:
    """Lower-case letters and digits; ``n-`` dropped, NASA ``tr2-butene`` read as ``trans-2-butene``."""
    name = re.sub(r"^tr(?=\d)", "trans", re.sub(r"^n-", "", name.strip().lower()))
    return re.sub(r"[^a-z0-9]", "", name)


def _record_names(record: CompoundRecord, cache: dict[str, set[str]]) -> set[str]:
    if record.id not in cache:
        labels = {record.name} if record.name else set()
        labels |= {v.source.label for values in record.properties.values() for v in values if v.source.label}
        labels |= {v.source.label for phases in record.equations.values() for values in phases.values()
                   for v in values if v.source.label}
        if record.identifier_source and record.identifier_source.label:
            labels.add(record.identifier_source.label)
        cache[record.id] = {_normalise(label) for label in labels} - {""}
    return cache[record.id]


def _name_matches(suffix: str, names: set[str]) -> bool:
    return suffix in names or (len(suffix) >= 4 and any(name.startswith(suffix) for name in names))


def _condensed_phase(key: str) -> str:
    base = _DUPLICATE.sub("", key).split(",", 1)[0]
    marker = _TRAILING_PHASE.search(base)
    return "liquid" if marker and marker.group(0).lower() == "(l)" else "solid"


def _nasa7_h298(sp: Nasa7Species) -> Optional[float]:
    if sp.Tmin is None or sp.Tmax is None or sp.Tmin > T_REF + 0.01 or sp.Tmax < T_REF:
        return None
    c = sp.nasa7.low if T_REF <= sp.nasa7.Tswitch else sp.nasa7.high
    t = T_REF
    return GAS_CONSTANT * t * (c.a1 + c.a2 * t / 2 + c.a3 * t**2 / 3 + c.a4 * t**3 / 4 + c.a5 * t**4 / 5 + c.a6 / t)


def _nasa9_h298(sp: Nasa9Species) -> Optional[float]:
    t = T_REF
    for r in sp.nasa9.ranges:
        if r.Tmin <= t + 0.01 and t <= r.Tmax:
            c = r.coeffs
            return GAS_CONSTANT * t * (-c.a1 / t**2 + c.a2 * math.log(t) / t + c.a3 + c.a4 * t / 2
                                       + c.a5 * t**2 / 3 + c.a6 * t**3 / 4 + c.a7 * t**4 / 5 + c.a8 / t)
    return None


def _round(value: Optional[float]) -> Optional[float]:
    return None if value is None else round(value, 1)


def _issue(kind: str, table: str, sp: NasaSpecies, **extra: Any) -> dict[str, Any]:
    return report_issue(kind, table, None, None, sp.key, phase=sp.phase, **extra)
