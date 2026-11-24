"""Map raw table filenames to alloy group / family."""

from __future__ import annotations

from typing import Optional, Tuple


# (group, family) — family None for non-steel groups without subfolders used as flat
FILE_CLASS: dict[str, Tuple[str, Optional[str]]] = {
    "carbon_steel.json": ("steel", "carbon"),
    "catbon_steel2.json": ("steel", "carbon"),  # legacy typo name
    "carbon_steel2.json": ("steel", "carbon"),
    "Free-cutting (resulfurized) carbon steel.json": ("steel", "free-cutting"),
    "Free-cutting (rephosphorized and resulfurized) carbon steel.json": ("steel", "free-cutting"),
    "merchant_quality_steel.json": ("steel", "merchant"),
    "High-manganese carbon steel.json": ("steel", "high-mn"),
    "High-manganese carbon steel 2.json": ("steel", "high-mn"),
    "high_mn_steel.json": ("steel", "high-mn"),
    "hsla_steel.json": ("steel", "hsla"),
    "low-alloy_steel.json": ("steel", "low-alloy"),
    "potential_standart_steel.json": ("steel", "low-alloy"),
    "ultrahigh-strength_steel.json": ("steel", "ultrahigh-strength"),
    "steel1.json": ("steel", "ultrahigh-strength"),
    "stainless_steel.json": ("steel", "stainless"),
    "tools_steel_thermal_conductivity.json": ("steel", "tool"),
    "tool_steel_thermal_expansion_and_density.json": ("steel", "tool"),
    "tool_steel_composition.json": ("steel", "tool"),
    "tool_steel_composition_obsolete.json": ("steel", "tool"),
    "stainless_heat_resistant_composition.json": ("steel", "stainless"),
    "former_sae_steel_composition.json": ("steel", None),
    "heat_resistent_steel.json": ("steel", "heat-resistant"),
    # Cross-family property tables — family inferred from grade when possible
    "thermal_conductivity.json": ("steel", None),
    "specific_heat.json": ("steel", None),
    "steel_thermal_expansion.json": ("steel", None),
    "electrical_resistivity.json": ("steel", None),
    "superalloys.json": ("superalloy", "wrought"),
    "superalloys2.json": ("superalloy", "wrought"),
    "superalloy3.json": ("superalloy", "wrought"),
    "1000h_strength.json": ("superalloy", "wrought"),
    "super_alloys_composition.json": ("superalloy", "wrought"),
    "super_alloys_composition_powder_metallurgy.json": ("superalloy", "powder-metallurgy"),
    "superalloys_mechanical_properties.json": ("superalloy", "powder-metallurgy"),
    "rene_95_superalloy.json": ("superalloy", "powder-metallurgy"),
    "oxide_dispersion_strengthened_superalloys.json": ("superalloy", "ods"),
    "supperalloy_oxide_dispersion.json": ("superalloy", "ods"),
    "stellite.json": ("stellite", None),
}

PURE_METAL_FILES = frozenset(
    {
        "thermal_conductivity_metals.json",
        "thermal_conductivity_metals2.json",
        "thermal_conductivity_metals3.json",
        "resisivity_metals.json",
    }
)


def classify_file(filename: str) -> Optional[Tuple[str, Optional[str]]]:
    if filename in PURE_METAL_FILES:
        return None
    return FILE_CLASS.get(filename)


def alloy_relpath(group: str, family: Optional[str], material_id: str) -> str:
    if group == "steel" and family:
        return f"alloys/steel/{family}/{material_id}.json"
    if group == "superalloy" and family:
        return f"alloys/superalloy/{family}/{material_id}.json"
    if group == "stellite":
        return f"alloys/stellite/{material_id}.json"
    return f"alloys/{group}/{material_id}.json"
