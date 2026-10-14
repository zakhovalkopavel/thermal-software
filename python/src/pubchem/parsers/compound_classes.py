"""
pubchem.parsers.compound_classes — CAS → compound class (inorganic / organic) from the compound data index.

Reads ``index.json`` of the compound data build (``compounds`` keyed by CAS, ``byOtherCas`` other CAS →
record CAS) as a plain file, so the package stays independent of the build. CAS numbers the index does
not know (``unresolved.json`` rows) have no class; entries without a CAS (``formula:Ag2S``) are left out.

Spec: docs/scripts/PUBCHEM_SPEC.md
"""
from __future__ import annotations

import json
import re
from pathlib import Path

_CAS = re.compile(r"^\d{2,7}-\d{2}-\d$")


def read_compound_classes(path: Path) -> dict[str, str]:
    """CAS → ``class`` of its record, other CAS numbers included."""
    index = json.loads(path.read_text(encoding="utf-8"))
    compounds = index.get("compounds", {})
    classes = {cas: compound["class"] for cas, compound in compounds.items() if _CAS.match(cas)}
    for other, cas in index.get("byOtherCas", {}).items():
        if _CAS.match(other) and cas in compounds:
            classes.setdefault(other, compounds[cas]["class"])
    return classes
