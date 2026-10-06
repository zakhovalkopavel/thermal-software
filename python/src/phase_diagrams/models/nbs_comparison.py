"""
phase_diagrams.models.nbs_comparison — An NSRDS-NBS 61 entry compared with an atlas invariant.
"""
from __future__ import annotations

from dataclasses import dataclass

from phase_diagrams.models.nbs_entry import NbsEntry


@dataclass
class NbsComparison:
    """Converted composition and differences; ΔT = T(NBS) − T(atlas)."""

    entry: NbsEntry
    converted_wt: dict[str, float]
    delta_T: float | None
    delta_wt: float | None
    within_tolerance: bool

    def comparison_text(self) -> str:
        parts = []
        if self.delta_T is not None:
            parts.append(f"ΔT = {_signed(self.delta_T)} °C")
        if self.delta_wt is not None:
            parts.append(f"Δ = {self.delta_wt:.1f} wt%")
        text = ", ".join(parts) + "."
        if self.entry.approximate:
            text = text[:-1] + " (approximate value)."
        return text

    def to_source(self, components: list[str]) -> dict:
        """NBS source block of an invariant, as in al2o3-mgo.json."""
        entry = self.entry
        reported: dict = {"system": "-".join(entry.components)}
        if entry.composition_mol is not None:
            reported["composition_mol"] = {c: v for c, v in zip(entry.components, entry.composition_mol)}
        if entry.approximate:
            reported["approximate"] = True
        reported["temperature_C"] = _number(entry.temperature_C)
        reported["uncertainty_C"] = _number(entry.uncertainty_C)
        return {
            "ref": "nsrds-nbs-61-1",
            "entry": entry.entry,
            "pdfPage": entry.pdf_page,
            "printedPage": entry.printed_page,
            "reported": reported,
            "converted_wt": {c: self.converted_wt[c] for c in components if c in self.converted_wt},
            "originalReference": " ".join(entry.references),
            "comparison": self.comparison_text(),
        }


def _number(value: float | None) -> float | int | None:
    if value is None:
        return None
    return int(value) if float(value).is_integer() else value


def _signed(value: float) -> str:
    rounded = round(value)
    if rounded == 0:
        return "0"
    return f"{rounded:+d}".replace("-", "−")
