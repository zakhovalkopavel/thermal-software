"""
phase_diagrams.models.nbs_entry — One parsed NSRDS-NBS 61 eutectic entry.
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class NbsEntry:
    """Entry of Table I. Composition in mol%, in the order of ``components``.

    For two-component systems the table gives one value (first-named component);
    the second is filled as 100 − value.
    """

    entry: int
    system: str
    components: list[str]
    composition_mol: list[float] | None
    temperature_C: float | None
    uncertainty_C: float | None
    approximate_composition: bool
    approximate_temperature: bool
    references: list[str]
    pdf_page: int
    printed_page: int
    raw: str = ""
    notes: list[str] = field(default_factory=list)

    @property
    def approximate(self) -> bool:
        return self.approximate_composition or self.approximate_temperature

    def to_dict(self, *, dataset: bool = False) -> dict:
        """Serialize one entry. ``dataset=True`` omits working-only pdfPage/printedPage/raw."""
        out = {
            "entry": self.entry,
            "system": self.system,
            "components": self.components,
            "composition_mol": self.composition_mol,
            "temperature_C": self.temperature_C,
            "uncertainty_C": self.uncertainty_C,
            "approximateComposition": self.approximate_composition,
            "approximateTemperature": self.approximate_temperature,
            "references": self.references,
            "notes": self.notes,
        }
        if not dataset:
            out["pdfPage"] = self.pdf_page
            out["printedPage"] = self.printed_page
            out["raw"] = self.raw
        return out

    @classmethod
    def from_dict(cls, data: dict) -> "NbsEntry":
        return cls(
            entry=data["entry"],
            system=data["system"],
            components=list(data["components"]),
            composition_mol=data["composition_mol"],
            temperature_C=data["temperature_C"],
            uncertainty_C=data["uncertainty_C"],
            approximate_composition=bool(data.get("approximateComposition", False)),
            approximate_temperature=bool(data.get("approximateTemperature", False)),
            references=list(data["references"]),
            pdf_page=int(data.get("pdfPage", 0)),
            printed_page=int(data.get("printedPage", 0)),
            raw=data.get("raw", ""),
            notes=list(data.get("notes", [])),
        )
