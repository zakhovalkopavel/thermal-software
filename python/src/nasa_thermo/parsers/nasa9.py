"""
nasa_thermo.parsers.nasa9 — Parser for NASA-9 thermodynamic files.

Supports two format variants
-----------------------------
  nasa9-origin.dat  — NASA RP-1311 (1996) format with ``thermo`` keyword
                      (see SOURCE header inside the file)

  nasa9-new.dat     — Burcat/Ruscic ANL-05/20 (2005/2023) extended database
                      (see SOURCE header inside the file)

Format reference
----------------
  shared/sources/NASA/nasa-1996-format.txt  (see SOURCE header inside the file)

Refs
----
  docs/REFERENCES.md  [9] Burcat2005, [23] NASA9, [24] CaltechSDT, [25] BurcatELTE
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

from nasa_thermo.nasa9_coeffs   import Nasa9Coeffs
from nasa_thermo.nasa9_equation import Nasa9Equation
from nasa_thermo.nasa9_range    import Nasa9Range
from nasa_thermo.nasa9_species  import Nasa9Species
from nasa_thermo.utils import parse_d

logger = logging.getLogger(__name__)


def parse_nasa9(
    paths: list[Path],
    *,
    only_gaseous: bool = False,
    filter_species: Optional[set[str]] = None,
) -> dict[str, Nasa9Species]:
    """
    Parse one or more NASA-9 files, merge them and return a species dict.

    Later files overwrite earlier entries with the same species name — this
    allows ``nasa9-new.dat`` (Burcat) to supersede ``nasa9-origin.dat`` for
    updated species.

    Parameters
    ----------
    paths:
        Ordered list of NASA-9 source paths.
    only_gaseous:
        When *True*, skip condensed-phase species (phase_flag ≠ 0).
    filter_species:
        If provided, only species in this set are returned.

    Returns
    -------
    dict[str, Nasa9Species]
        Species map keyed by the trimmed species name.
    """
    merged: dict[str, Nasa9Species] = {}
    for file_idx, path in enumerate(paths):
        file_species, skipped, overwrites, errors = _parse_file(
            path, only_gaseous, filter_species, existing=merged
        )
        merged.update(file_species)
        logger.info(
            "[nasa9] Source %d: %s — %d species, %d overwrites, "
            "%d single-T skipped, %d errors",
            file_idx + 1,
            path.name,
            len(file_species),
            overwrites,
            skipped,
            errors,
        )
    logger.info("[nasa9] Total written: %d species", len(merged))
    return merged


# ── file-level parser ─────────────────────────────────────────────────────────


def _parse_file(
    path: Path,
    only_gaseous: bool,
    filter_species: Optional[set[str]],
    existing: dict[str, Nasa9Species],
) -> tuple[dict[str, Nasa9Species], int, int, int]:
    """
    Returns ``(species_dict, skipped_single_t, overwrites, errors)``.
    """
    raw = path.read_text(encoding="utf-8", errors="replace").splitlines()

    # Detect format variant by presence of 'thermo' keyword in the first 100 lines
    has_thermo_kw = any(ln.strip().lower() == "thermo" for ln in raw[:100])

    species: dict[str, Nasa9Species] = {}
    duplicates: dict[str, int] = {}
    errors = 0
    skipped_single_t = 0
    overwrites = 0

    n = len(raw)
    i = _find_data_start(raw, has_thermo_kw)

    def _next(pos: int) -> int:
        """Advance past blank and comment-only lines."""
        while pos < n and (not raw[pos].strip() or raw[pos].lstrip().startswith("!")):
            pos += 1
        return pos

    i = _next(i)

    while i < n:
        line = raw[i]
        stripped = line.strip()

        if not stripped or stripped.startswith("!"):
            i += 1
            continue

        upper = stripped.upper()
        if upper in ("END PRODUCTS", "END REACTANTS", "END"):
            i += 1
            continue

        # Species block line 1: must NOT start with space or digit
        if line[0] in (" ", "\t") or line[0].isdigit():
            i += 1
            continue

        # ── Line 1 ───────────────────────────────────────────────────────────
        line1 = line
        i += 1
        i = _next(i)
        if i >= n:
            break

        # ── Line 2 ───────────────────────────────────────────────────────────
        line2 = raw[i]
        i += 1

        # A valid line 2 starts with space + digit
        if not (len(line2) > 1 and line2[0] == " " and line2[1:2].strip().isdigit()):
            i -= 1   # re-process this line as a potential species line 1
            continue

        try:
            n_intervals = int(line2[1:2].strip()) if line2[1:2].strip() else 0
        except (ValueError, IndexError):
            logger.error("Cannot read interval count near line %d", i)
            errors += 1
            continue

        ref_code  = line2[3:9].strip()  if len(line2) > 9  else ""
        phase_str = line2[51:52].strip() if len(line2) > 51 else ""
        mw_str    = line2[52:65].strip() if len(line2) > 65 else ""
        hf_str    = line2[65:80].strip() if len(line2) > 80 else ""

        try:
            phase_flag = int(phase_str) if phase_str else 0
        except ValueError:
            phase_flag = 0

        mw: Optional[float] = _try_float(mw_str)
        hf298 = _try_float(hf_str, parser=parse_d) or 0.0

        if n_intervals == 0:
            # Single-temperature condensed phase — skip
            skipped_single_t += 1
            i = _next(i)
            if i < n:
                i += 1
            continue

        name = line1[:24].split()[0] if line1[:24].strip() else line1.strip().split()[0]
        comment = line1[24:].strip() if len(line1) > 24 else ""

        skip_entry = (
            (filter_species is not None and name not in filter_species)
            or (only_gaseous and phase_flag != 0)
        )

        # ── Interval blocks ───────────────────────────────────────────────────
        ranges: list[Nasa9Range] = []
        parse_ok = True

        for interval_idx in range(n_intervals):
            i = _next(i)
            if i >= n:
                parse_ok = False
                break
            line3 = raw[i]; i += 1

            i = _next(i)
            if i >= n:
                parse_ok = False
                break
            line4 = raw[i]; i += 1

            i = _next(i)
            if i >= n:
                parse_ok = False
                break
            line5 = raw[i]; i += 1

            if skip_entry:
                continue

            try:
                rng = _parse_interval(line3, line4, line5)
                ranges.append(rng)
            except Exception as exc:
                logger.error(
                    "Error parsing interval %d for '%s': %s",
                    interval_idx + 1, name, exc,
                )
                parse_ok = False
                break

        if skip_entry:
            continue
        if not parse_ok:
            errors += 1
            continue

        # ── Validate ──────────────────────────────────────────────────────────
        _validate(name, n_intervals, ranges, mw)

        # ── Store ─────────────────────────────────────────────────────────────
        phase_label = "gas" if phase_flag == 0 else "condensed"
        entry = Nasa9Species(
            name=name,
            comment=comment,
            refCode=ref_code,
            phase=phase_label,
            MW=mw,
            Hf298=hf298,
            nasa9=Nasa9Equation(ranges=ranges),
        )

        if name in species:
            cnt = duplicates.get(name, 1) + 1
            duplicates[name] = cnt
            new_name = f"{name}#{cnt}"
            logger.warning(
                "Duplicate in %s: '%s' → '%s'", path.name, name, new_name
            )
            entry = Nasa9Species(
                name=new_name,
                comment=entry.comment,
                refCode=entry.refCode,
                phase=entry.phase,
                MW=entry.MW,
                Hf298=entry.Hf298,
                nasa9=entry.nasa9,
            )
            species[new_name] = entry
        else:
            if name in existing:
                overwrites += 1
            species[name] = entry

    return species, skipped_single_t, overwrites, errors


# ── interval parser ───────────────────────────────────────────────────────────


def _parse_interval(line3: str, line4: str, line5: str) -> Nasa9Range:
    """Parse one temperature-interval block (lines 3–5) into a Nasa9Range."""
    tmin = float(line3[1:11].strip())
    tmax = float(line3[11:21].strip())
    h0_str = line3[65:80].strip()
    h0 = parse_d(h0_str) if h0_str else 0.0

    # Line 4: 5 × D16.8
    a1 = parse_d(line4[0:16])
    a2 = parse_d(line4[16:32])
    a3 = parse_d(line4[32:48])
    a4 = parse_d(line4[48:64])
    a5 = parse_d(line4[64:80])

    # Line 5: column-slice is robust for both origin and Burcat-new formats.
    # Origin  : 2×D16.8 + 16-char gap       + 2×D16.8
    # New     : 2×D16.8 + zero D16.8 field  + 2×D16.8
    # In both cases b1 lives at cols 48-63, b2 at cols 64-79.
    a6 = parse_d(line5[0:16])
    a7 = parse_d(line5[16:32])
    b1 = parse_d(line5[48:64])
    b2 = parse_d(line5[64:80])

    return Nasa9Range(
        Tmin=tmin,
        Tmax=tmax,
        H0=h0,
        coeffs=Nasa9Coeffs(a1, a2, a3, a4, a5, a6, a7, b1, b2),
    )


# ── validation ────────────────────────────────────────────────────────────────


def _validate(
    name: str,
    n_intervals: int,
    ranges: list[Nasa9Range],
    mw: Optional[float],
) -> None:
    if len(ranges) != n_intervals:
        logger.warning(
            "'%s': expected %d ranges, got %d", name, n_intervals, len(ranges)
        )
    for k in range(len(ranges) - 1):
        if abs(ranges[k].Tmax - ranges[k + 1].Tmin) > 0.1:
            logger.warning(
                "'%s': range gap between interval %d and %d: %.3f ≠ %.3f",
                name, k + 1, k + 2, ranges[k].Tmax, ranges[k + 1].Tmin,
            )
    if mw is None or mw <= 0:
        logger.warning("'%s': suspicious MW=%s", name, mw)


# ── data-start detection ──────────────────────────────────────────────────────


def _find_data_start(raw: list[str], has_thermo_kw: bool) -> int:
    """Return the index of the first species-data line."""
    n = len(raw)
    if has_thermo_kw:
        for i, line in enumerate(raw):
            if line.strip().lower() == "thermo":
                return i + 2   # skip 'thermo' + global range line
        return 0
    # Burcat-new: no 'thermo' — find first valid species line 1
    return _find_nasa9_new_data_start(raw)


def _find_nasa9_new_data_start(raw: list[str]) -> int:
    """
    For the Burcat/nasa9-new format: locate the index of the first species
    block line 1.  A valid line 1 is non-blank/non-comment, starts with a
    non-space/non-digit character, and is immediately followed (skipping
    blank/comment lines) by a line that starts with space + digit (line 2).
    """
    n = len(raw)
    for i in range(n):
        line = raw[i]
        if not line.strip() or line.lstrip().startswith("!"):
            continue
        if line[0] in (" ", "\t") or line[0].isdigit():
            continue
        # Look-ahead: find the next non-blank/comment line
        j = i + 1
        while j < n and (not raw[j].strip() or raw[j].lstrip().startswith("!")):
            j += 1
        if (
            j < n
            and len(raw[j]) > 1
            and raw[j][0] == " "
            and raw[j][1:2].strip().isdigit()
        ):
            return i
    return 0


# ── helpers ───────────────────────────────────────────────────────────────────


def _try_float(
    s: str,
    parser=float,
) -> Optional[float]:
    try:
        return parser(s) if s.strip() else None
    except (ValueError, AttributeError):
        return None

