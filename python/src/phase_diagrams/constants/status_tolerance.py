"""
phase_diagrams.constants.status_tolerance — Agreement tolerance between the atlas and NSRDS-NBS 61.

Matches sources.json → statusLegend.confirmed.
"""
from __future__ import annotations

STATUS_TOLERANCE: dict[str, float] = {
    "temperature_C": 10.0,
    "composition_wt": 1.5,
}
