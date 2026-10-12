"""
janaf.parsers.janaf_table — Parse NIST-JANAF tab-separated table files (py-janaf copy).

File layout::

    Titanium Oxide (TiO2)<TAB>O2Ti1(cr,l)
    T(K)  Cp  S  -[G-H(Tr)]/T  H-H(Tr)  delta-f H  delta-f G  log Kf
    0     0.000  0.000  INFINITE  -8.636  -939.870  -939.870  INFINITE
    ...
    2130.000  79.228  190.133  126.276  136.016  CRYSTAL <--> LIQUID
    2130.000  100.416  221.563  126.276  202.960  TRANSITION

Spec: docs/scripts/JANAF_PARSER_SPEC.md
Refs: docs/REFERENCES.md  [36] NISTJANAF
"""
from __future__ import annotations

import logging
import re
from pathlib import Path
from typing import Iterable, Optional

from janaf.janaf_row import JanafRow
from janaf.janaf_table import JanafTable
from janaf.janaf_transition import JanafTransition

logger = logging.getLogger(__name__)

_TITLE = re.compile(r"^(?P<name>.*?)\s*\((?P<formula>[^()]*)\)\s*$")
_HEADER_FORMULA = re.compile(r"^(?P<formula>.*?)\((?P<phase>[^()]*)\)\s*$")
_INFINITE = {"inf", "+inf", "-inf", "infinite", "+infinite", "-infinite"}
_TRANSITION_MARK = "<-->"


def parse_janaf_table(path: Path, label: Optional[str] = None) -> JanafTable:
    """Parse one table file; the table ID is the file stem (``O-045``)."""
    lines = path.read_text(encoding="utf-8").splitlines()
    if not lines:
        raise ValueError(f"{path}: empty file")
    name, formula, janaf_formula, phase = _parse_title(lines[0])
    table = JanafTable(
        table_id=path.stem,
        name=name,
        formula=formula,
        janaf_formula=janaf_formula,
        phase=phase,
        label=label,
    )
    for line_no, line in enumerate(lines[2:], start=3):
        row = _parse_row(line)
        if row is None:
            if line.strip():
                logger.debug("%s:%d: skipped %r", path.name, line_no, line)
            continue
        table.rows.append(row)
        if row.note and _TRANSITION_MARK in row.note:
            table.transitions.append(JanafTransition(T=row.T, label=row.note, line=line_no))
    return table


def parse_janaf_tables(
    data_dir: Path,
    index: dict[str, str],
    prefixes: Optional[Iterable[str]] = None,
) -> list[JanafTable]:
    """Parse every ``<ID>.txt`` in *data_dir*: index order first, then files missing from the index."""
    wanted = set(prefixes) if prefixes else None
    files = {p.stem: p for p in data_dir.glob("*.txt")}
    ordered = [i for i in index if i in files]
    for table_id in index:
        if table_id not in files:
            logger.warning("Index entry without a file: %s", table_id)
    for table_id in sorted(files.keys() - index.keys()):
        logger.warning("File missing from the index: %s", table_id)
        ordered.append(table_id)

    tables = []
    for table_id in ordered:
        if wanted is not None and table_id.rsplit("-", 1)[0] not in wanted:
            continue
        tables.append(parse_janaf_table(files[table_id], index.get(table_id)))
    return tables


def _parse_title(line: str) -> tuple[str, Optional[str], str, Optional[str]]:
    title, _, header = line.partition("\t")
    title_match = _TITLE.match(title.strip())
    if title_match:
        name, formula = title_match["name"], title_match["formula"]
    else:
        name, formula = title.strip(), None
    header_match = _HEADER_FORMULA.match(header.strip())
    if header_match:
        janaf_formula, phase = header_match["formula"], header_match["phase"]
    else:
        janaf_formula, phase = header.strip(), None
    return name, formula, janaf_formula, phase


def _parse_row(line: str) -> Optional[JanafRow]:
    cells = _split_cells(line)
    if not cells or not _is_number(cells[0]) or _is_infinite(cells[0]):
        return None
    head = (cells + [""] * 5)[:5]
    T, Cp, S, gef, dH = (_number(c) for c in head)
    tail = cells[5:]
    while tail and not tail[-1]:
        tail.pop()
    filled = [c for c in tail if c]
    note = None
    if all(_is_number(c) for c in filled) and len(tail) <= 3:
        dfH, dfG, logKf = (_number(c) for c in (tail + [""] * 3)[:3])
    elif all(_is_number(c) for c in filled) and len(filled) <= 3:
        dfH, dfG, logKf = (_number(c) for c in (filled + [""] * 3)[:3])
    else:
        dfH = dfG = logKf = None
        note = " ".join(filled)
    return JanafRow(T=T, Cp=Cp, S=S, gef=gef, dH=dH, dfH=dfH, dfG=dfG, logKf=logKf, note=note)


def _split_cells(line: str) -> list[str]:
    cells: list[str] = []
    for cell in line.split("\t"):
        cell = cell.strip()
        parts = cell.split()
        if len(parts) > 1 and all(_is_number(p) for p in parts):
            cells.extend(parts)
        else:
            cells.append(cell)
    return cells


def _is_infinite(text: str) -> bool:
    return text.lower() in _INFINITE


def _is_number(text: str) -> bool:
    if _is_infinite(text):
        return True
    try:
        float(text)
    except ValueError:
        return False
    return True


def _number(text: str) -> Optional[float]:
    if not text or _is_infinite(text):
        return None
    try:
        return float(text)
    except ValueError:
        return None
