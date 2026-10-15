"""
phase_diagrams.output.isotherm_draft_report — Markdown report of the isotherm detector: pieces, evidence, comparison with the config.

Spec: docs/scripts/PHASE_DIAGRAM_EXTRACTION_SPEC.md § Isotherm detection
"""
from __future__ import annotations

from phase_diagrams.models.isotherm_detection import IsothermDetection


def isotherm_draft_report(
    name: str,
    detection: IsothermDetection,
    rows: list[dict] | None = None,
    unmatched: list[int] | None = None,
) -> str:
    """Report: summary, the comparison with the config isotherms (``compare_isotherm_draft`` rows,
    when given), every detected piece (number = the ``D`` label on the draft image) with its evidence,
    the review items and the log."""
    pieces = detection.isotherms
    lines = [f"# Isotherm draft — {name}\n",
             "Detected on the page by `detect-isotherms`; the draft config entries are in the `.json` beside this report. "
             "D-numbers are the labels on the draft image.\n"]
    determined = [p for p in pieces if p.temperature_C is not None]
    lines.append(f"- {len(pieces)} isotherm pieces in {len({p.field for p in pieces})} fields; "
                 f"{len(determined)} with a temperature ({_count(pieces, 'label')} read, {_count(pieces, 'continuation')} "
                 f"continued from another field, {_count(pieces, 'boundary order')} from the boundary order)")
    lines.append(f"- {len(detection.dropped)} thin lines dropped as not isotherms (leaders, joins, outside the fields)")
    if rows is not None:
        found = sum(1 for r in rows if r["pieces"])
        agree = sum(1 for r in rows if r["agrees"])
        lines.append(f"- config isotherms: {found} of {len(rows)} found, {agree} with the same temperature; "
                     f"{len(unmatched or [])} detected pieces on no config isotherm")
        lines.append("\n## Config isotherms\n")
        lines.append("| Field | °C | Part | Detected pieces | Coverage | Detected °C | Agrees |")
        lines.append("| --- | --- | --- | --- | --- | --- | --- |")
        for r in rows:
            lines.append(f"| {r['field']} | {r['temperature_C']} | {r['part']} | "
                         f"{', '.join(f'D{k + 1}' for k in r['pieces']) or '—'} | {r['coverage']:.0%} | "
                         f"{', '.join(f'{t:g}' for t in r['detected_C']) or '—'} | {'yes' if r['agrees'] else 'no'} |")
        if unmatched:
            lines.append("\n## Detected pieces on no config isotherm\n")
            for k in unmatched:
                p = pieces[k]
                lines.append(f"- D{k + 1} {p.field} {_t(p)}: {_px(p.start)}→{_px(p.end)}")
    lines.append("\n## Detected pieces\n")
    for k, p in enumerate(pieces):
        lines.append(f"- **D{k + 1}** {p.field} {_t(p)} ({p.source or 'undetermined'}), line {p.group}: "
                     f"{_px(p.start)}→{_px(p.end)}" + (", dashed" if p.dashed else ""))
        if p.candidates:
            lines.append(f"  - candidates: {', '.join(f'{t:g}' for t in p.candidates)}")
        for note in p.evidence:
            lines.append(f"  - {note}")
    if detection.review:
        lines.append("\n## Review\n")
        lines.extend(f"- [{item.kind}] {item.subject}: {item.message}" for item in detection.review)
    lines.append("\n## Log\n")
    lines.extend(f"- {line}" for line in detection.log)
    return "\n".join(lines) + "\n"


def _count(pieces, source: str) -> int:
    return sum(1 for p in pieces if p.source == source)


def _t(piece) -> str:
    return "? °C" if piece.temperature_C is None else f"{piece.temperature_C:g} °C"


def _px(p) -> str:
    return f"({p[0]:.0f}, {p[1]:.0f})"
