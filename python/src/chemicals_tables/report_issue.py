"""
chemicals_tables.report_issue — One entry of the build report (``report.json``).

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from typing import Any, Optional


def report_issue(
    kind: str, table: Optional[str], line: Optional[int], cas: Optional[str], label: Optional[str], **extra: Any
) -> dict[str, Any]:
    """``{"issue": kind, "table", "line", "cas", "label", ...extra}``."""
    return {"issue": kind, "table": table, "line": line, "cas": cas, "label": label, **extra}
