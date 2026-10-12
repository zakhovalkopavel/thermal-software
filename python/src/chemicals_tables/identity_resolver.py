"""
chemicals_tables.identity_resolver — Give source rows without CAS and formula their identity override.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from typing import Any, Optional

from chemicals_tables.constants.identity_overrides import IDENTITY_OVERRIDES
from chemicals_tables.identity_override import IdentityOverride
from chemicals_tables.report_issue import report_issue
from chemicals_tables.source_entry import SourceEntry


def apply_identity_overrides(
    entries: list[SourceEntry], overrides: Optional[dict[tuple[str, int], IdentityOverride]] = None,
) -> list[dict[str, Any]]:
    """Set CAS, formula, SMILES and ``variant`` of the overridden rows in place; returns report issues."""
    overrides = IDENTITY_OVERRIDES if overrides is None else overrides
    issues: list[dict[str, Any]] = []
    for entry in entries:
        source = entry.value.source
        override = overrides.get((source.key, source.line)) if source.line is not None else None
        if override is None:
            continue
        entry.cas, entry.formula, entry.smiles = override.cas, override.formula, override.smiles
        if override.variant:
            source.extra["variant"] = override.variant
        issues.append(report_issue("identityOverride", source.table, source.line, override.cas, source.label,
                                   formula=override.formula, reason=override.reason))
    return issues
