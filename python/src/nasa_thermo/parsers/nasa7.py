"""
nasa_thermo.parsers.nasa7 — Parser for NASA-7 (SP-273 / 1971) thermodynamic files.

Format reference
----------------
  shared/sources/NASA/nasa-1971-format.txt  (see SOURCE header inside the file)

Input file
----------
  shared/sources/NASA/nasa7-origin.dat  (see SOURCE header inside the file)

Refs
----
  docs/REFERENCES.md  [8] NASA7, [24] CaltechSDT
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

from nasa_thermo.nasa7_coeffs   import Nasa7Coeffs
from nasa_thermo.nasa7_equation import Nasa7Equation
from nasa_thermo.nasa7_species  import Nasa7Species
from nasa_thermo.utils import slice_e15

logger = logging.getLogger(__name__)


def parse_nasa7(
    path: Path,
    *,
    only_gaseous: bool = False,
    filter_species: Optional[set[str]] = None,
) -> dict[str, Nasa7Species]:
    """
    Parse a NASA-7 (SP-273) file and return a mapping of species name → Nasa7Species.

    Parameters
    ----------
    path:
        Path to the NASA-7 source file (e.g. ``nasa7-origin.dat``).
    only_gaseous:
        When *True*, silently skip condensed-phase species (phase ≠ ``G``).
    filter_species:
        If provided, only species whose names appear in this set are returned.

    Returns
    -------
    dict[str, Nasa7Species]
        Species map keyed by the trimmed species name.
    """
    raw = path.read_text(encoding="utf-8", errors="replace").splitlines()

    tmid, data_start = _locate_thermo_header(raw)
    species: dict[str, Nasa7Species] = {}
    duplicates: dict[str, int] = {}
    errors = 0

    i = data_start
    while i < len(raw):
        line = raw[i]

        if not line.strip():
            i += 1
            continue
        if line.strip().upper() == "END":
            break

        # Species block: col 79 (0-indexed) must be '1'
        if len(line) >= 80 and line[79] == "1":
            block, j = _collect_block(raw, i)
            if len(block) < 4:
                logger.warning("Incomplete NASA-7 block at line %d — skipping", i + 1)
                i = j
                continue

            try:
                entry = _parse_block(block, tmid)
            except Exception as exc:
                logger.error("Error parsing NASA-7 block at line %d: %s", i + 1, exc)
                errors += 1
                i = j
                continue

            if entry is None:
                i = j
                continue

            if filter_species is not None and entry.name not in filter_species:
                i = j
                continue

            if only_gaseous and entry.phase not in ("G", "g"):
                i = j
                continue

            name = entry.name
            if name in species:
                cnt = duplicates.get(name, 1) + 1
                duplicates[name] = cnt
                new_name = f"{name}#{cnt}"
                logger.warning(
                    "Duplicate NASA-7 species '%s' → renamed '%s'", name, new_name
                )
                entry = Nasa7Species(
                    name=new_name,
                    comment=entry.comment,
                    phase=entry.phase,
                    MW=entry.MW,
                    Tmin=entry.Tmin,
                    Tmax=entry.Tmax,
                    nasa7=entry.nasa7,
                )
                name = new_name

            species[name] = entry
            i = j
        else:
            i += 1

    dup_count = sum(1 for v in duplicates.values() if v > 1)
    logger.info(
        "[nasa7] Parsed %d species, %d errors, %d duplicates renamed",
        len(species),
        errors,
        dup_count,
    )
    return species


# ── private helpers ───────────────────────────────────────────────────────────


def _locate_thermo_header(raw: list[str]) -> tuple[float, int]:
    """Find the THERMO keyword, extract global Tmid, return (tmid, data_start_idx)."""
    tmid = 1000.0
    for idx, line in enumerate(raw):
        if line.strip().upper() == "THERMO":
            for j in range(idx + 1, len(raw)):
                if raw[j].strip():
                    parts = raw[j].split()
                    if len(parts) >= 2:
                        try:
                            tmid = float(parts[1])
                        except ValueError:
                            pass
                    return tmid, j + 1
            break
    return tmid, 0


def _collect_block(raw: list[str], start: int) -> tuple[list[str], int]:
    """Collect the 4 non-blank lines of a species block starting at *start*."""
    block: list[str] = [raw[start]]
    j = start + 1
    while j < len(raw) and len(block) < 4:
        if raw[j].strip():
            block.append(raw[j])
        j += 1
    return block, j


def _parse_block(block: list[str], tmid: float) -> Optional[Nasa7Species]:
    """Parse 4 fixed-width lines into a Nasa7Species.  Returns *None* for blank names."""
    L1, L2, L3, L4 = block[0], block[1], block[2], block[3]

    name = L1[0:18].strip()
    if not name:
        return None

    # Comment: remainder of line 1, strip trailing record counter
    comment_raw = L1[18:].rstrip()
    if comment_raw.endswith("1"):
        comment_raw = comment_raw[:-1]
    comment = comment_raw.strip()

    phase = (L1[44:45].strip() or "G") if len(L1) > 44 else "G"

    tmin: Optional[float] = _try_float(L1, 45, 55)
    tmax: Optional[float] = _try_float(L1, 55, 65)
    mw:   Optional[float] = _try_float(L1, 65, 79)

    if mw is not None and mw <= 0:
        logger.warning("NASA-7 '%s': suspicious MW=%s", name, mw)

    # Coefficients
    # Line 2: a1_h .. a5_h  (5 × E15.8)
    # Line 3: a6_h, a7_h, a1_l, a2_l, a3_l  (5 × E15.8)
    # Line 4: a4_l, a5_l, a6_l, a7_l  (4 × E15.8) + optional Hf°/R
    h = slice_e15(L2, 5)
    m = slice_e15(L3, 5)
    lo = slice_e15(L4, 4)

    high = Nasa7Coeffs(h[0], h[1], h[2], h[3], h[4], m[0], m[1])
    low  = Nasa7Coeffs(m[2], m[3], m[4], lo[0], lo[1], lo[2], lo[3])

    return Nasa7Species(
        name=name,
        comment=comment,
        phase=phase,
        MW=mw,
        Tmin=tmin,
        Tmax=tmax,
        nasa7=Nasa7Equation(Tswitch=tmid, low=low, high=high),
    )


def _try_float(line: str, start: int, end: int) -> Optional[float]:
    try:
        s = line[start:end].strip()
        return float(s) if s else None
    except (ValueError, IndexError):
        return None

