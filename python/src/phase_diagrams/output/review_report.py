"""
phase_diagrams.output.review_report — Review list markdown (review/<system>.md).

Spec: docs/scripts/PHASE_DIAGRAM_EXTRACTION_SPEC.md § Review outputs
"""
from __future__ import annotations

from phase_diagrams.models.review_item import ReviewItem


def review_report(name: str, review: list[ReviewItem], log: list[str]) -> str:
    """One line per item grouped by kind (in ``ReviewItem.KINDS`` order), then the run log."""
    lines = [f"# Review — {name}", ""]
    if not review:
        lines += ["No items.", ""]
    for kind in ReviewItem.KINDS:
        items = [r for r in review if r.kind == kind]
        if not items:
            continue
        lines += [f"## {kind}", ""]
        lines += [f"- `{r.subject}`: {r.message}" for r in items]
        lines.append("")
    if log:
        lines += ["## Log", ""]
        lines += [f"- {entry}" for entry in log]
        lines.append("")
    return "\n".join(lines)
