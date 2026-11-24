"""
compound_data.constants.class_overrides — Carbon compounds whose class the bond rule gets wrong, by CAS.

The bond rule (``chemical_formula.organic_bonds``) calls the first group organic (a C–H or C–NH bond),
but they are conventionally inorganic: the hydrogen acids of the pseudohalogens, next to the cyanides,
cyanates and thiocyanates. Tetranitromethane has only C–N bonds but is a nitroalkane.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

from compound_data.class_override import ClassOverride

_PSEUDOHALOGEN = "pseudohalogen hydrogen acid, inorganic like the cyanides, cyanates and thiocyanates"

CLASS_OVERRIDES: dict[str, ClassOverride] = {
    "74-90-8": ClassOverride("inorganic", f"hydrogen cyanide HCN: {_PSEUDOHALOGEN}"),
    "3017-23-0": ClassOverride("inorganic", f"deuterium cyanide DCN: {_PSEUDOHALOGEN}"),
    "75-13-8": ClassOverride("inorganic", f"isocyanic acid HNCO: {_PSEUDOHALOGEN}"),
    "3129-90-6": ClassOverride("inorganic", f"isothiocyanic acid HNCS: {_PSEUDOHALOGEN}"),
    "509-14-8": ClassOverride("organic", "tetranitromethane C(NO2)4: a nitroalkane, the nitro analogue of CCl4"),
}
