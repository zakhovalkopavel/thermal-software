"""
nasa_thermo.writers — JSON serialisation for NASA thermodynamic species dicts.

Writes the two canonical output files:
  shared/processed/nasa7.json
  shared/processed/nasa9.json

JSON shapes match the TypeScript types in:
  backend/src/common/thermal/type/nasa7-equation.ts
  backend/src/common/thermal/type/nasa9-equation.ts

Spec: docs/scripts/NASA_THERMO_PARSER_SPEC.md
Refs: docs/REFERENCES.md  [8] NASA7, [9] Burcat2005, [23] NASA9,
      [24] CaltechSDT, [25] BurcatELTE
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path

from nasa_thermo.nasa7_species import Nasa7Species
from nasa_thermo.nasa9_species import Nasa9Species

logger = logging.getLogger(__name__)

# ── metadata constants ────────────────────────────────────────────────────────

NASA7_META = {
    "source": "NASA SP-273 (1971) — nasa7-origin.dat",
    "ref":    "McBride, Zehe, Gordon — NASA TM-2002-211556",
    "url":    "https://shepherd.caltech.edu/EDL/PublicResources/sdt/SDToolbox/cti/NASA7/nasa7.dat",
}

NASA9_META = {
    "source": (
        "NASA RP-1311 (1996) + Burcat/Ruscic ANL-05/20 (2005/2023)"
    ),
    "ref": (
        "Burcat, A.; Ruscic, B. — Third Millennium Ideal Gas Thermochemical Database, ANL-05/20"
    ),
    "url": "https://publications.anl.gov/anlpubs/2005/07/53802.pdf",
}


# ── public API ────────────────────────────────────────────────────────────────


def write_nasa7_json(
    species: dict[str, Nasa7Species],
    out_dir: Path,
) -> None:
    """Serialise *species* to ``<out_dir>/nasa7.json``."""
    _write(
        out_path=out_dir / "nasa7.json",
        meta=NASA7_META,
        species={name: sp.to_dict() for name, sp in species.items()},
    )


def write_nasa9_json(
    species: dict[str, Nasa9Species],
    out_dir: Path,
) -> None:
    """Serialise *species* to ``<out_dir>/nasa9.json``."""
    _write(
        out_path=out_dir / "nasa9.json",
        meta=NASA9_META,
        species={name: sp.to_dict() for name, sp in species.items()},
    )


# ── private ───────────────────────────────────────────────────────────────────


def _write(*, out_path: Path, meta: dict, species: dict) -> None:
    payload = {
        **meta,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "count": len(species),
        "species": species,
    }
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False, allow_nan=False),
        encoding="utf-8",
    )
    logger.info("[output] Written → %s  (%d species)", out_path, len(species))

