"""
compound_data.parsers.yaws1999_identity — Resolve Yaws table rows to CAS via appendix indexes.

Join order: validated CAS from the CAS appendix by (normalized name, Hill), then synonym+Hill,
then unique primary name+Hill, then unique Hill-only for simple unambiguous inorganics.

Spec: tmp/spec/02_yaws1999_compound_data_update.md
"""
from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional

from chemical_formula.formula_elements import formula_elements
from chemical_formula.hill_formula import hill_formula
from compound_data.label_normalize import normalize_label
from pubchem.cas_number import is_cas

_WS = re.compile(r"\s+")
_NON_ALNUM = re.compile(r"[^a-z0-9]+")


@dataclass
class YawsIdentity:
    """One appendix identity row with normalized lookup keys."""

    cas: Optional[str]
    name: str
    formula: str
    hill: Optional[str]
    synonyms: list[str] = field(default_factory=list)


@dataclass
class YawsIdentityIndex:
    """Lookup tables built from the CAS and synonym appendix JSON files."""

    by_name_hill: dict[tuple[str, str], list[YawsIdentity]] = field(default_factory=dict)
    by_hill: dict[str, list[YawsIdentity]] = field(default_factory=dict)
    by_cas: dict[str, YawsIdentity] = field(default_factory=dict)
    issues: list[dict[str, Any]] = field(default_factory=list)

    def resolve(self, name: Optional[str], formula: Optional[str]) -> tuple[Optional[str], Optional[str], str]:
        """Return ``(cas, hill, status)``.

        ``status`` is ``matched``, ``ambiguous``, ``bad_formula``, ``no_match``, or ``formula_only``.
        """
        hill = hill_of(formula)
        if formula and hill is None:
            return None, None, "bad_formula"
        key_name = _norm_name(name)
        if key_name and hill:
            hits = self.by_name_hill.get((key_name, hill), [])
            cas = _unique_cas(hits)
            if cas:
                return cas, hill, "matched"
            if hits:
                return None, hill, "ambiguous"
            # Synonym appendix rows store primary name; also try each synonym key already indexed.
        if hill:
            hits = self.by_hill.get(hill, [])
            cas = _unique_cas(hits)
            if cas and _is_simple_inorganic(hill):
                return cas, hill, "formula_only"
            if len({h.cas for h in hits if h.cas}) > 1:
                return None, hill, "ambiguous"
        return None, hill, "no_match"


def load_yaws1999_identity(cas_path: Path, synonym_path: Path) -> YawsIdentityIndex:
    """Build the identity index from the two appendix files."""
    index = YawsIdentityIndex()
    for path, kind in ((cas_path, "cas"), (synonym_path, "synonym")):
        if not path.is_file():
            index.issues.append({"issue": "yaws1999MissingAppendix", "path": str(path), "kind": kind})
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        for row in data.get("rows", []):
            _add_row(index, row, kind)
    return index


def _add_row(index: YawsIdentityIndex, row: dict[str, Any], kind: str) -> None:
    cas = row.get("cas")
    if cas and not is_cas(str(cas)):
        index.issues.append({
            "issue": "yaws1999BadCas", "cas": cas, "name": row.get("name"), "formula": row.get("formula"),
            "kind": kind,
        })
        cas = None
    formula = row.get("formula")
    hill = hill_of(formula)
    if formula and hill is None:
        index.issues.append({
            "issue": "yaws1999BadAppendixFormula", "cas": cas, "name": row.get("name"),
            "formula": formula, "kind": kind,
        })
    name = row.get("name") or ""
    synonyms = [str(s) for s in row.get("synonyms") or [] if s]
    identity = YawsIdentity(cas=cas, name=str(name), formula=str(formula or ""), hill=hill, synonyms=synonyms)
    if cas:
        _merge_by_cas(index, identity)
        identity = index.by_cas[cas]
    names = [name, *synonyms]
    for label in names:
        key = _norm_name(label)
        if not key:
            continue
        if hill:
            index.by_name_hill.setdefault((key, hill), []).append(identity)
    if hill:
        index.by_hill.setdefault(hill, []).append(identity)


def _merge_by_cas(index: YawsIdentityIndex, identity: YawsIdentity) -> None:
    """Keep one identity per validated CAS; union synonyms and fill missing formula/hill."""
    assert identity.cas
    existing = index.by_cas.get(identity.cas)
    if existing is None:
        index.by_cas[identity.cas] = identity
        return
    labels = [
        *existing.synonyms, *identity.synonyms,
        existing.name, identity.name,
    ]
    primary = existing.name or identity.name
    primary_key = _norm_name(primary)
    merged: list[str] = []
    seen: set[str] = set()
    for label in labels:
        key = _norm_name(label)
        if not key or key == primary_key or key in seen:
            continue
        seen.add(key)
        merged.append(label)
    existing.synonyms = merged
    if not existing.name and identity.name:
        existing.name = identity.name
    if (not existing.hill or not existing.formula) and identity.hill:
        existing.hill = identity.hill
        existing.formula = identity.formula


def hill_of(formula: Optional[str]) -> Optional[str]:
    """Return the Hill formula string, or ``None`` when the formula cannot be parsed."""
    if not formula:
        return None
    try:
        return hill_formula(formula_elements(str(formula)))
    except ValueError:
        return None


# Back-compat alias used by older call sites / tests.
_hill = hill_of


def _norm_name(name: Optional[str]) -> str:
    if not name:
        return ""
    text = normalize_label(str(name)).casefold()
    text = _WS.sub(" ", text).strip()
    return _NON_ALNUM.sub("", text)


def _unique_cas(hits: list[YawsIdentity]) -> Optional[str]:
    cases = {h.cas for h in hits if h.cas}
    if len(cases) == 1:
        return next(iter(cases))
    return None


def _is_simple_inorganic(hill: str) -> bool:
    """Formula-only matching is only safe without carbon (no organic isomers)."""
    try:
        counts = formula_elements(hill)
    except ValueError:
        return False
    return "C" not in counts
