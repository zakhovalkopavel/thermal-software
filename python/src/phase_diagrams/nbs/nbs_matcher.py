"""
phase_diagrams.nbs.nbs_matcher — Compare atlas invariants with NSRDS-NBS 61 entries.

Spec: docs/scripts/PHASE_DIAGRAM_EXTRACTION_SPEC.md § Conversion and comparison
"""
from __future__ import annotations

from phase_diagrams.nbs.composition_converter import convert_composition
from phase_diagrams.models.nbs_comparison import NbsComparison
from phase_diagrams.models.nbs_entry import NbsEntry
from phase_diagrams.constants.status_tolerance import STATUS_TOLERANCE


class NbsMatcher:
    """Lookup, conversion to wt% and comparison of NBS entries."""

    def __init__(self, entries: list[NbsEntry]):
        self.entries = entries
        self._by_number: dict[int, list[NbsEntry]] = {}
        for entry in entries:
            self._by_number.setdefault(entry.entry, []).append(entry)

    def entry(self, number: int) -> NbsEntry:
        found = self._by_number.get(number)
        if not found:
            raise KeyError(f"NBS entry {number} not in the index")
        return found[0]

    def suggest(self, components: list[str]) -> list[tuple[NbsEntry, dict[str, float] | None]]:
        """Entries with exactly these components, with the composition converted to wt% when possible."""
        wanted = set(components)
        out = []
        for entry in self.entries:
            if set(entry.components) == wanted and len(entry.components) == len(components):
                out.append((entry, self.converted_wt(entry)))
        out.sort(key=lambda item: (item[0].temperature_C or 0.0, item[0].entry))
        return out

    @staticmethod
    def converted_wt(entry: NbsEntry) -> dict[str, float] | None:
        if entry.composition_mol is None:
            return None
        try:
            return convert_composition(dict(zip(entry.components, entry.composition_mol)), "wt")
        except KeyError:
            return None

    def compare(self, number: int, liquid_wt: dict[str, float], temperature_C: float) -> NbsComparison:
        entry = self.entry(number)
        if set(entry.components) != set(liquid_wt):
            raise ValueError(f"NBS entry {number} ({entry.system}) does not match components {sorted(liquid_wt)}")
        converted = self.converted_wt(entry) or {}
        delta_wt = max(abs(converted[c] - liquid_wt[c]) for c in liquid_wt) if converted else None
        delta_t = entry.temperature_C - temperature_C if entry.temperature_C is not None else None
        within = (
            delta_t is not None
            and delta_wt is not None
            and abs(delta_t) <= STATUS_TOLERANCE["temperature_C"] + 1e-9
            and delta_wt <= STATUS_TOLERANCE["composition_wt"] + 1e-9
        )
        if delta_wt is not None:
            delta_wt = round(delta_wt, 1)
        return NbsComparison(entry=entry, converted_wt=converted, delta_T=delta_t, delta_wt=delta_wt, within_tolerance=within)
