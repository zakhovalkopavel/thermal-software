"""
phase_diagrams.config.invariant_spec — One invariant point in a binary config.
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class InvariantSpec:
    """Printed values and seed pixels of an invariant.

    ``label_composition`` is wt% of the x component; ``None`` = not printed
    (digitized value used and flagged; for ``compound-melting`` the
    stoichiometric composition from compounds.json is used).
    ``label_temperature`` ``None`` = not printed: the detected invariant line,
    else the junction pixel, gives the temperature (flagged). Not allowed for
    ``compound-melting``.
    """

    id: str
    type: str
    reaction: str | None
    phases: list[str]
    label_temperature: float | None
    label_composition: float | None
    seed_pixel: tuple[float, float]
    nbs: list[int] = field(default_factory=list)
    notes: str | None = None
    label_second_composition: float | None = None
    second_seed_pixel: tuple[float, float] | None = None
    label_box: tuple[int, int, int, int] | None = None

    @classmethod
    def from_dict(cls, data: dict) -> "InvariantSpec":
        label = data["label"]
        seed = data["seedPixel"]
        second = data.get("secondSeedPixel")
        box = data.get("labelBox")
        return cls(
            id=data["id"],
            type=data["type"],
            reaction=data.get("reaction"),
            phases=list(data["phases"]),
            label_temperature=label.get("temperature"),
            label_composition=label.get("composition"),
            seed_pixel=(float(seed[0]), float(seed[1])),
            nbs=[int(n) for n in data.get("nbs", [])],
            notes=data.get("notes"),
            label_second_composition=label.get("secondComposition"),
            second_seed_pixel=(float(second[0]), float(second[1])) if second else None,
            label_box=tuple(int(v) for v in box) if box else None,
        )
