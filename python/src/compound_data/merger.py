"""
compound_data.merger — Merge source entries into one ``CompoundRecord`` per CAS (or formula without CAS).

Formula precedence: ``FORMULA_OVERRIDES``, then the identifier databases, then the source's own
formula column. Source formulas that differ (in Hill notation) from the resolved one are reported.
Class: ``CLASS_OVERRIDES``, else the bond rule on the SMILES (``has_organic_bond``), else the formula
rule (``classify_compound``); overrides and formula-rule records are reported. Organic families come
from the SMILES (``OrganicFamilyClassifier``), else from the formula when it alone fixes them
(``formula_family``, reported).
Inorganic carbon-free records without identifier (CAS unknown to the identifier files, or no CAS)
move onto the single identified record of their formula (``other_cas``). No values are averaged;
equations are ordered by ``SOURCE_PRIORITY``.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any, Optional

from chemical_formula.compound_class import classify_compound
from chemical_formula.formula_elements import ISOTOPES, formula_elements
from chemical_formula.formula_family import formula_family
from chemical_formula.hill_formula import hill_formula
from chemical_formula.iupac_formula import iupac_formula
from chemical_formula.organic_bonds import has_organic_bond
from chemical_formula.organic_family import OrganicFamilyClassifier, UNCLASSIFIED
from chemicals_tables.equation_value import EquationValue
from chemicals_tables.identifier import Identifier
from chemicals_tables.property_value import PropertyValue
from chemicals_tables.raw_value import RawValue
from chemicals_tables.source_entry import SourceEntry
from chemicals_tables.transport_value import TransportValue
from compound_data.class_override import ClassOverride
from compound_data.compound_record import CompoundRecord
from compound_data.constants.class_overrides import CLASS_OVERRIDES
from compound_data.constants.formula_overrides import FORMULA_OVERRIDES
from compound_data.constants.source_priority import SOURCE_PRIORITY
from compound_data.formula_override import FormulaOverride

_CHARGE = re.compile(r"[+-]\d*$")
_SYMBOL = re.compile(r"[A-Z][a-z]?")


@dataclass
class MergeResult:
    """Merged records by id, entries that could not be resolved, and report issues."""

    records: dict[str, CompoundRecord] = field(default_factory=dict)
    unresolved: list[dict[str, Any]] = field(default_factory=list)
    conflicts: list[dict[str, Any]] = field(default_factory=list)
    shared_formulas: list[dict[str, Any]] = field(default_factory=list)
    unknown_cas_moved: list[dict[str, Any]] = field(default_factory=list)
    unknown_cas_kept: list[dict[str, Any]] = field(default_factory=list)
    no_cas_moved: list[dict[str, Any]] = field(default_factory=list)
    no_cas_kept: list[dict[str, Any]] = field(default_factory=list)
    class_overridden: list[dict[str, Any]] = field(default_factory=list)
    class_from_formula: list[dict[str, Any]] = field(default_factory=list)
    family_from_formula: list[dict[str, Any]] = field(default_factory=list)


def merge_compounds(
    entries: list[SourceEntry],
    identifiers: dict[str, Identifier],
    classifier: OrganicFamilyClassifier,
    overrides: Optional[dict[str, FormulaOverride]] = None,
    class_overrides: Optional[dict[str, ClassOverride]] = None,
) -> MergeResult:
    """Group entries, resolve formulas and classify; see the module docstring for the rules."""
    overrides = FORMULA_OVERRIDES if overrides is None else overrides
    class_overrides = CLASS_OVERRIDES if class_overrides is None else class_overrides
    result = MergeResult()
    first_formula: dict[str, str] = {}
    for entry in entries:
        if entry.cas and entry.formula:
            first_formula.setdefault(entry.cas, entry.formula)
    groups: dict[str, list[SourceEntry]] = {}
    for entry in entries:
        if entry.cas and not _detach(entry, _resolved_formula(entry.cas, identifiers, overrides, first_formula), result):
            key = entry.cas
        elif entry.formula:
            key = f"formula:{entry.formula}"
        else:
            result.unresolved.append(_unresolved(None, [entry], "no CAS and no formula"))
            continue
        groups.setdefault(key, []).append(entry)

    for key, group in groups.items():
        cas = None if key.startswith("formula:") else group[0].cas
        identifier = identifiers.get(cas) if cas else None
        override = overrides.get(cas) if cas else None
        source_formulas = list(dict.fromkeys(e.formula for e in group if e.formula))

        if override is not None:
            formula = override.formula
            if identifier is not None and identifier.formula != override.formula:
                result.conflicts.append({
                    "cas": cas, "formula": formula, "identifierFormula": identifier.formula,
                    "identifierSource": identifier.source.to_dict(), "resolution": "override",
                    "reason": override.reason,
                })
        elif identifier is not None and identifier.formula:
            formula = identifier.formula
        elif source_formulas:
            formula = source_formulas[0]
        else:
            result.unresolved.append(_unresolved(cas, group, "formula not found"))
            continue

        try:
            counts = formula_elements(formula)
        except ValueError as exc:
            result.unresolved.append(_unresolved(cas, group, f"formula not parsed: {exc}"))
            continue
        hill = hill_formula(counts)
        _report_source_formulas(result, cas, hill, group)

        smiles = identifier.smiles if identifier else next((e.smiles for e in group if e.smiles), None)
        name = (identifier.name if identifier else None) or next((e.label for e in group if e.label), None)
        compound_class, group_name = _classify(result, cas, hill, name, counts, smiles, class_overrides)
        families = _families(result, classifier, cas, hill, name, counts, smiles) if compound_class == "organic" else []
        if compound_class == "organic":
            group_name = families[0] if families else UNCLASSIFIED

        record = CompoundRecord(
            id=key, cas=cas, formula=formula, hill=hill,
            display_formula=iupac_formula(counts) if compound_class == "inorganic" else hill,
            elements=list(counts),
            compound_class=compound_class, group=group_name, name=name,
            Mr=_molar_mass(identifier, override),
            smiles=smiles, inchikey=identifier.inchikey if identifier else None,
            pubchem_cid=identifier.cid if identifier else None, families=families,
            identifier_source=identifier.source if identifier else None,
        )
        for entry in group:
            _add_value(record, entry)
        _sort_by_priority(record)
        result.records[key] = record

    _move_unidentified(result, overrides)
    _report_shared_formulas(result)
    return result


def _classify(
    result: MergeResult, cas: Optional[str], hill: str, name: Optional[str], counts: dict[str, float],
    smiles: Optional[str], class_overrides: dict[str, ClassOverride],
) -> tuple[str, Optional[str]]:
    """Class and inorganic folder; see the module docstring for the precedence."""
    override = class_overrides.get(cas) if cas else None
    bond = has_organic_bond(smiles) if "C" in counts else None
    organic = bond if override is None else override.compound_class == "organic"
    compound_class, group_name = classify_compound(counts, organic)
    item = {"cas": cas, "formula": hill, "name": name, "class": compound_class}
    if override is not None:
        result.class_overridden.append({**item, "bondRule": bond, "reason": override.reason})
    elif "C" in counts and bond is None and set(counts) != {"C"}:
        result.class_from_formula.append(item)
    return compound_class, group_name


def _families(
    result: MergeResult, classifier: OrganicFamilyClassifier, cas: Optional[str], hill: str, name: Optional[str],
    counts: dict[str, float], smiles: Optional[str],
) -> list[str]:
    """SMARTS families of the SMILES; without a match, the family the formula alone fixes (reported)."""
    families = classifier.families(smiles)
    if families:
        return families
    family = formula_family(counts)
    if family is None:
        return []
    result.family_from_formula.append({"cas": cas, "formula": hill, "name": name, "family": family})
    return [family]


def _move_unidentified(result: MergeResult, overrides: dict[str, FormulaOverride]) -> None:
    """Move records without identifier onto the one identified record of their formula.

    Unidentified: a CAS no identifier file knows (Perry 2-151 files many elements and salts under
    CAS numbers of nothing, Mg under 22537-22-0), or no CAS at all (detached rows such as Perry Al
    under 3303-34-2, which PubChem gives to L-alanyl-L-leucine). The identifier files miss many real
    compounds, so only inorganic formulas without carbon, isotopes or charge are moved, where one
    formula is one compound or its polymorphs. A moved CAS goes to ``other_cas``; everything else is
    reported as kept.
    """
    identified: dict[str, list[CompoundRecord]] = {}
    for record in result.records.values():
        if record.identifier_source is not None and _plain(record):
            identified.setdefault(record.hill, []).append(record)
    unidentified = [
        r for r in result.records.values()
        if r.identifier_source is None and (r.cas is None or r.cas not in overrides)
    ]
    for record in sorted(unidentified, key=lambda r: r.id):
        targets = identified.get(record.hill, [])
        movable = record.compound_class == "inorganic" and "C" not in record.elements and _plain(record)
        moved, kept = (
            (result.unknown_cas_moved, result.unknown_cas_kept) if record.cas
            else (result.no_cas_moved, result.no_cas_kept)
        )
        if movable and len(targets) == 1:
            target = targets[0]
            target.other_cas = sorted({*target.other_cas, *([record.cas] if record.cas else []), *record.other_cas})
            for prop, values in record.properties.items():
                target.properties.setdefault(prop, []).extend(values)
            for prop, phases in record.equations.items():
                for phase, values in phases.items():
                    target.equations.setdefault(prop, {}).setdefault(phase, []).extend(values)
            target.raw.extend(record.raw)
            for prop, values in record.transport.items():
                target.transport.setdefault(prop, []).extend(values)
            _sort_by_priority(target)
            del result.records[record.id]
            moved.append({"from": record.id, "cas": record.cas, "formula": record.hill, "name": record.name,
                          "id": target.id})
        else:
            kept.append({
                "id": record.id, "cas": record.cas, "formula": record.hill, "name": record.name,
                "candidates": sorted(t.id for t in targets),
            })


def _plain(record: CompoundRecord) -> bool:
    """No isotope symbols (``D2``, ``[18O]``) and no charge in the record's own formula."""
    return not (
        "[" in record.formula or _CHARGE.search(record.formula)
        or any(s in ISOTOPES for s in _SYMBOL.findall(record.formula))
    )


def _resolved_formula(
    cas: str, identifiers: dict[str, Identifier], overrides: dict[str, FormulaOverride],
    first_formula: dict[str, str],
) -> Optional[str]:
    """Override, else identifier formula, else the first source formula seen for the CAS."""
    if cas in overrides:
        return overrides[cas].formula
    identifier = identifiers.get(cas)
    if identifier is not None and identifier.formula:
        return identifier.formula
    return first_formula.get(cas)


def _detach(entry: SourceEntry, resolved: Optional[str], result: MergeResult) -> bool:
    """True when the row's own formula contradicts its CAS, so the row goes to ``formula:<F>``.

    Contradiction: other elements, or counts that are not proportional (``AlCl3·6H2O`` vs pubchem
    ``AlCl3H2O``; Perry ``Ne`` filed under 79-24-3, nitroethane). Proportional formulas
    (As2S3 / As4S6) and unparseable source formulas keep the CAS.
    """
    if not entry.formula or not entry.cas or not resolved:
        return False
    try:
        source_counts = formula_elements(entry.formula)
        resolved_counts = formula_elements(resolved)
    except ValueError:
        return False
    if _proportional(source_counts, resolved_counts):
        return False
    result.conflicts.append({
        "cas": entry.cas, "formula": hill_formula(resolved_counts), "sourceFormula": entry.formula,
        "sourceHill": hill_formula(source_counts), "source": entry.value.source.to_dict(),
        "resolution": "detached", "id": f"formula:{entry.formula}",
    })
    return True


def _proportional(a: dict[str, float], b: dict[str, float]) -> bool:
    if set(a) != set(b):
        return False
    first = next(iter(a))
    ratio = b[first] / a[first]
    return all(abs(b[e] - a[e] * ratio) <= 1e-9 * max(1.0, b[e]) for e in a)


def _add_value(record: CompoundRecord, entry: SourceEntry) -> None:
    value = entry.value
    if isinstance(value, PropertyValue):
        record.properties.setdefault(entry.property, []).append(value)
    elif isinstance(value, EquationValue):
        record.equations.setdefault(entry.property, {}).setdefault(entry.phase or "none", []).append(value)
    elif isinstance(value, RawValue):
        record.raw.append(value)
    elif isinstance(value, TransportValue):
        record.transport.setdefault(entry.property, []).append(value)


def _priority(value: Any) -> int:
    try:
        return SOURCE_PRIORITY.index(value.ref)
    except ValueError:
        return len(SOURCE_PRIORITY)


def _sort_by_priority(record: CompoundRecord) -> None:
    for prop, values in record.properties.items():
        record.properties[prop] = sorted(values, key=_priority)
    for phases in record.equations.values():
        for phase, values in phases.items():
            phases[phase] = sorted(values, key=_priority)


def _molar_mass(identifier: Optional[Identifier], override: Optional[FormulaOverride]) -> Optional[float]:
    """kg/mol from the identifier MW; None when the formula was overridden (the MW is of the wrong formula)."""
    if identifier is None or identifier.mw is None or override is not None:
        return None
    return identifier.mw / 1000


def _report_source_formulas(result: MergeResult, cas: Optional[str], hill: str, group: list[SourceEntry]) -> None:
    seen: set[tuple[str, str]] = set()
    for entry in group:
        if not entry.formula:
            continue
        try:
            source_hill = hill_formula(formula_elements(entry.formula))
        except ValueError:
            source_hill = None
        if source_hill == hill:
            continue
        table = entry.value.source.table
        if (table, entry.formula) in seen:
            continue
        seen.add((table, entry.formula))
        result.conflicts.append({
            "cas": cas, "formula": hill, "sourceFormula": entry.formula, "sourceHill": source_hill,
            "source": entry.value.source.to_dict(), "resolution": "identifier",
        })


def _report_shared_formulas(result: MergeResult) -> None:
    """Inorganic formulas carried by more than one CAS (polymorphs, or one compound under two CAS)."""
    by_hill: dict[str, list[str]] = {}
    for record in result.records.values():
        if record.compound_class == "inorganic" and record.cas:
            by_hill.setdefault(record.hill, []).append(record.cas)
    for hill, cas_list in sorted(by_hill.items()):
        if len(cas_list) > 1:
            result.shared_formulas.append({"formula": hill, "cas": sorted(cas_list)})


def _unresolved(cas: Optional[str], group: list[SourceEntry], reason: str) -> dict[str, Any]:
    return {
        "cas": cas,
        "labels": sorted({e.label for e in group if e.label}),
        "formulas": sorted({e.formula for e in group if e.formula}),
        "reason": reason,
        "values": [
            {"property": e.property, "phase": e.phase, **e.value.to_dict()} for e in group
        ],
    }
