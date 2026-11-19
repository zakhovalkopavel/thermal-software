"""
compound_data.coolprop_links — Attach CoolProp fluid ``INFO.NAME`` keys to merged records.

Each CoolProp ``fluids/*.json`` is matched by CAS (``INFO.CAS``) to a compound-data
record. The fluid name is appended to ``record.coolprop`` (same shape as ``nasa7`` /
``nasa9``: a list of keys). CoolProp CAS values are unique across the fluid set.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
Refs: docs/REFERENCES.md  [CoolProp]
"""
from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable, Optional

from chemicals_tables.report_issue import report_issue
from compound_data.compound_record import CompoundRecord

logger = logging.getLogger(__name__)

_LABELLED_NAME = re.compile(r"\b(deuterium|tritium|tritiated)\b", re.I)


@dataclass(frozen=True)
class CoolpropFluid:
    """One CoolProp fluid file, reduced to what matching needs."""

    name: str
    cas: str
    path: str


def load_coolprop_fluids(fluids_dir: Path) -> list[CoolpropFluid]:
    """Read ``INFO.NAME`` / ``INFO.CAS`` from every ``*.json`` under ``fluids_dir``."""
    out: list[CoolpropFluid] = []
    if not fluids_dir.is_dir():
        return out
    for path in sorted(fluids_dir.glob("*.json")):
        doc = json.loads(path.read_text(encoding="utf-8"))
        info = doc.get("INFO") or {}
        name = info.get("NAME") or path.stem
        cas = info.get("CAS") or info.get("CASNO")
        if not cas:
            continue
        out.append(CoolpropFluid(str(name), _normalize_cas(str(cas)), str(path)))
    return out


def attach_coolprop(
    records: dict[str, CompoundRecord],
    fluids: Iterable[CoolpropFluid],
) -> tuple[list[dict[str, Any]], dict[str, int]]:
    """Add CoolProp fluid names to ``record.coolprop`` by CAS; returns issues and counts."""
    by_cas: dict[str, list[CompoundRecord]] = {}
    for record in records.values():
        cas = _record_cas(record)
        if cas:
            by_cas.setdefault(cas, []).append(record)

    issues: list[dict[str, Any]] = []
    counts = {
        "coolpropFluids": 0,
        "coolpropLinked": 0,
        "coolpropNoRecord": 0,
        "coolpropAmbiguous": 0,
        "coolpropRecords": 0,
    }

    for fluid in fluids:
        counts["coolpropFluids"] += 1
        candidates = by_cas.get(fluid.cas, [])
        if not candidates:
            counts["coolpropNoRecord"] += 1
            issues.append(report_issue(
                "coolpropNoRecord", "CoolProp", None, fluid.cas, fluid.name,
                coolprop=fluid.name,
            ))
            continue
        if len(candidates) > 1:
            plain = [r for r in candidates if not _looks_labelled(r)]
            use = plain if len(plain) == 1 else candidates
            if len(use) != 1:
                counts["coolpropAmbiguous"] += 1
                issues.append(report_issue(
                    "coolpropAmbiguous", "CoolProp", None, fluid.cas, fluid.name,
                    coolprop=fluid.name, ids=[r.id for r in candidates],
                ))
                continue
            candidates = use
        record = candidates[0]
        if fluid.name not in record.coolprop:
            record.coolprop.append(fluid.name)
        counts["coolpropLinked"] += 1

    counts["coolpropRecords"] = sum(1 for r in records.values() if r.coolprop)
    return issues, counts


def _record_cas(record: CompoundRecord) -> Optional[str]:
    raw = record.cas or record.pubchem_cas
    return _normalize_cas(raw) if raw else None


def _normalize_cas(raw: str) -> str:
    return raw.strip()


def _looks_labelled(record: CompoundRecord) -> bool:
    name = record.name or ""
    if re.search(r"[0-9()]", name):
        return True
    return bool(_LABELLED_NAME.search(name))
