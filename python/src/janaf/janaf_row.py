"""
janaf.janaf_row — One temperature row of a NIST-JANAF table.

Refs: docs/REFERENCES.md  [36] NISTJANAF
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass
class JanafRow:
    """One row of a JANAF table; ``None`` marks an empty or infinite cell and is left out of the JSON.

    gef = −[G − H(Tr)]/T, dH = H − H(Tr), Tr = 298.15 K.
    ``note`` holds text found in place of dfH/dfG/logKf (e.g. ``CRYSTAL <--> LIQUID``).
    Units are fixed per column and documented in the backend ``JanafRow`` interface.

    Refs: docs/REFERENCES.md  [36] NISTJANAF
    """

    T: float
    Cp: Optional[float]
    S: Optional[float]
    gef: Optional[float]
    dH: Optional[float]
    dfH: Optional[float]
    dfG: Optional[float]
    logKf: Optional[float]
    note: Optional[str] = None

    def to_dict(self) -> dict:
        out = {
            "T": self.T,
            "Cp": self.Cp,
            "S": self.S,
            "gef": self.gef,
            "dH": self.dH,
            "dfH": self.dfH,
            "dfG": self.dfG,
            "logKf": self.logKf,
            "note": self.note,
        }
        return {key: value for key, value in out.items() if value is not None}
