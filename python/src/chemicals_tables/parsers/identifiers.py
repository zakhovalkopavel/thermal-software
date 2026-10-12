"""
chemicals_tables.parsers.identifiers — CAS → formula, MW, SMILES, InChIKey and name.

The identifier files have no header. Columns: pubchem id, CAS, formula (Hill), MW, SMILES, InChI,
InChIKey, IUPAC name, common name, synonyms... Precedence: ``Inorganic db``, ``pubchem small``,
``pubchem large``; the first file that has a CAS wins. Only the requested CAS numbers are loaded.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from pathlib import Path
from typing import Iterable, Optional

from chemicals_tables.chemicals_source import ChemicalsSource
from chemicals_tables.constants.source_tables import IDENTIFIER_TABLES, SOURCE_TABLES
from chemicals_tables.identifier import Identifier
from chemicals_tables.parsers.number import parse_number


def load_identifiers(source_dir: Path, chem: ChemicalsSource, wanted: Iterable[str]) -> dict[str, Identifier]:
    """Identifiers of ``wanted`` CAS numbers found in the identifier files."""
    remaining = set(wanted)
    found: dict[str, Identifier] = {}
    for name in IDENTIFIER_TABLES:
        table = SOURCE_TABLES[name]
        path = source_dir / table.path
        if not path.exists() or not remaining:
            continue
        with path.open(encoding="utf-8") as fh:
            for line, text in enumerate(fh, start=1):
                head = text.split("\t", 2)
                if len(head) < 3 or head[1].strip() not in remaining:
                    continue
                cells = [c.strip() for c in text.rstrip("\n").split("\t")]
                cells += [""] * (9 - len(cells))
                cas = cells[1]
                found[cas] = Identifier(
                    cas=cas,
                    formula=cells[2],
                    mw=parse_number(cells[3]),
                    smiles=cells[4] or None,
                    inchikey=cells[6] or None,
                    name=cells[8] or cells[7] or None,
                    source=chem.link(table, line, cells[8] or cells[7] or None),
                    cid=_cid(cells[0]),
                )
                remaining.discard(cas)
    return found


def _cid(cell: str) -> Optional[int]:
    """PubChem CID; the Inorganic db uses negative ids for compounds PubChem does not have."""
    return int(cell) if cell.isdigit() and int(cell) > 0 else None
