"""
chemicals_tables.constants.identity_overrides — Identities of source rows without CAS and formula.

Keyed by (file key, 1-based line). Each entry has a cited reason.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
Refs: docs/REFERENCES.md  [7] Poling5, [39] Zabransky1996
"""
from __future__ import annotations

from chemicals_tables.identity_override import IdentityOverride

IDENTITY_OVERRIDES: dict[tuple[str, int], IdentityOverride] = {
    ("poling", 367): IdentityOverride(
        cas="1333-74-0", formula="H2", variant="normal",
        reason=(
            'Poling "hydrogen, normal" under chemicals pseudo-CAS 2099474000-00-0 (fails the CAS check digit): '
            "normal (3:1 ortho/para) hydrogen; Cpg 28.83 vs 28.84 J/(mol K) of the hydrogen row 1333-74-0"
        ),
    ),
    ("poling", 368): IdentityOverride(
        cas="7782-39-0", formula="D2", variant="normal",
        reason=(
            'Poling "deuterium, normal" under chemicals pseudo-CAS 2099437000-00-0 (fails the CAS check digit): '
            "normal deuterium; Cpg 29.2 vs 29.19 J/(mol K) of the deuterium row 7782-39-0"
        ),
    ),
    ("zabransky", 2): IdentityOverride(
        formula="C10H25O5U", smiles="CCO[U](OCC)(OCC)(OCC)OCC",
        reason=(
            'Zabransky "Pentaethoxyuranium" with CASRN "None": U(OC2H5)5 by name; '
            "PubChem has no compound for this name or uranium(V) ethoxide"
        ),
    ),
}
