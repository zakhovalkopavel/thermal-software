"""Map minerals-thermodynamic phase rows → compound-data property / raw patches.

Refs:
  [60] RobieHemingway1995
  [61] HollandPowell2011
  [62] Abdul2023
  [64] Pankratz1982
  [65] Jung2009AlTiO
  [66] Malan2019
  [67] Watanabe2000
  [68] Koroleva2017
  [70] Mao2006
  [71] Yazhenskikh2007
"""

from __future__ import annotations

from typing import Any

KJ_TO_J = 1000.0


def _ref(ref: str, *extra: Any) -> list[Any]:
    out: list[Any] = [ref]
    for x in extra:
        if x is not None and x != "":
            out.append(x)
    return out


def _scalar(value: float, phase: str, ref: list[Any]) -> dict[str, Any]:
    return {"value": value, "phase": phase, "ref": ref}


def _raw(property_name: str, phase: str, values: dict[str, Any], ref: list[Any]) -> dict[str, Any]:
    return {"property": property_name, "phase": phase, "values": values, "ref": ref}


def map_phase_to_patches(
    phase_id: str,
    row: dict[str, Any],
    *,
    source_ref: str,
    convention: str | None,
) -> dict[str, Any]:
    """Return ``{properties, equations, raw}`` patches for one ok phase."""
    ref_key = str(row.get("ref") or source_ref)
    page = row.get("pdfPage") or row.get("page") or row.get("table")
    base_ref = _ref(ref_key, page, convention)
    phase = str(row.get("state") or "solid")
    props: dict[str, list[dict[str, Any]]] = {}
    equations: dict[str, Any] = {}
    raw: list[dict[str, Any]] = []

    def add_prop(key: str, value: float | None, *, scale: float = 1.0) -> None:
        if value is None:
            return
        props.setdefault(key, []).append(_scalar(float(value) * scale, phase, list(base_ref)))

    # --- formation / entropy / Gibbs (multiple unit conventions) ---
    if row.get("Hf298_kJmol") is not None:
        add_prop("enthalpyFormation298", row["Hf298_kJmol"], scale=KJ_TO_J)
    elif row.get("Hf298_Jmol") is not None:
        add_prop("enthalpyFormation298", row["Hf298_Jmol"])
    elif row.get("H_Jmol") is not None:
        # Holland–Powell HSC enthalpy (not SER); keep convention in ref.
        add_prop("enthalpyFormation298", row["H_Jmol"])

    if row.get("S298_JmolK") is not None:
        add_prop("entropy298", row["S298_JmolK"])
    elif row.get("S0_JmolK") is not None:
        add_prop("entropy298", row["S0_JmolK"])

    if row.get("Gf298_kJmol") is not None:
        add_prop("gibbsEnergy298", row["Gf298_kJmol"], scale=KJ_TO_J)
    elif row.get("G0_Jmol") is not None:
        add_prop("gibbsEnergy298", row["G0_Jmol"])

    if row.get("Cp298_JmolK") is not None:
        add_prop("heatCapacity298", row["Cp298_JmolK"])

    if row.get("V0_Jbar") is not None:
        # Holland–Powell V0 in J/bar (= 10^-5 m³); store as raw molarVolume source unit.
        raw.append(
            _raw(
                "hollandPowellV0",
                phase,
                {"V0_Jbar": row["V0_Jbar"], "GH_Jmol": row.get("GH_Jmol"), "eos": row.get("eos")},
                list(base_ref),
            )
        )

    if row.get("Tm_K") is not None:
        add_prop("meltingPoint", row["Tm_K"])
    if row.get("Hfus_kJmol") is not None:
        add_prop("heatOfFusion", row["Hfus_kJmol"], scale=KJ_TO_J)

    # --- Cp equations (store as raw when no dedicated EquationType) ---
    cp = row.get("cp")
    if isinstance(cp, dict) and any(cp.get(k) is not None for k in cp if k not in ("form", "units", "raw")):
        raw.append(_raw("heatCapacity", phase, dict(cp), list(base_ref)))

    # Robie-style ranges if present on non-Robie rows
    if row.get("cpRanges"):
        raw.append(_raw("robieCpRanges", phase, {"cpRanges": row["cpRanges"]}, list(base_ref)))

    # --- SER / Einstein G(T) ---
    if isinstance(row.get("G"), dict):
        raw.append(
            _raw(
                "gibbsEnergySER",
                phase,
                {
                    "gFunction": row.get("gFunction"),
                    "Tmin_K": row.get("Tmin_K"),
                    "Tmax_K": row.get("Tmax_K"),
                    "G": row["G"],
                    "tdbPhase": row.get("tdbPhase"),
                    "polymorph": row.get("polymorph"),
                },
                list(base_ref),
            )
        )

    # --- Mao-style Gm − HSER expression ---
    if row.get("expressionRaw") or row.get("property") == "Gm_minus_HSER":
        raw.append(
            _raw(
                "gibbsEnergySER",
                phase,
                {
                    "property": row.get("property"),
                    "expressionRaw": row.get("expressionRaw"),
                    "numbers": row.get("numbers"),
                    "note": row.get("note"),
                },
                list(base_ref),
            )
        )

    # --- melt / SS / MQM parameter blocks ---
    if row.get("model") or row.get("parameters") or row.get("parameters") == []:
        raw.append(
            _raw(
                "solutionModel",
                "liquid" if "liquid" in phase_id.lower() or phase == "liquid" else phase,
                {
                    "phaseId": phase_id,
                    "model": row.get("model"),
                    "parameters": row.get("parameters"),
                    "ternaryParameters": row.get("ternaryParameters"),
                    "ternaryApproximation": row.get("ternaryApproximation"),
                    "adoptedFrom": row.get("adoptedFrom"),
                    "note": row.get("note"),
                    "formula": row.get("formula"),
                },
                list(base_ref),
            )
        )

    # --- experimental series ---
    if row.get("series"):
        raw.append(
            _raw(
                "experimentalSeries",
                phase,
                {
                    "series": row["series"],
                    "propertyMeta": row.get("propertyMeta"),
                    "nPoints": row.get("nPoints"),
                    "doi": row.get("doi"),
                    "note": row.get("note"),
                },
                list(base_ref),
            )
        )

    # --- heat content fits (Watanabe) ---
    if isinstance(row.get("heatContent"), dict):
        raw.append(_raw("heatContent", phase, dict(row["heatContent"]), list(base_ref)))

    # --- associate / inventory partials with species lists ---
    if row.get("species") or row.get("systems"):
        raw.append(
            _raw(
                "associateSpeciesInventory",
                phase,
                {
                    "species": row.get("species"),
                    "systems": row.get("systems"),
                    "numericLPrinted": row.get("numericLPrinted"),
                    "note": row.get("note"),
                },
                list(base_ref),
            )
        )

    # Catch-all: any leftover numeric fields not already mapped
    known = {
        "formula",
        "name",
        "phaseId",
        "status",
        "ref",
        "convention",
        "table",
        "page",
        "pdfPage",
        "note",
        "family",
        "state",
        "endmember",
        "eos",
        "oxideCompositionLine",
        "sourceFile",
        "Hf298_kJmol",
        "Hf298_Jmol",
        "H_Jmol",
        "GH_Jmol",
        "G0_Jmol",
        "S298_JmolK",
        "S0_JmolK",
        "Gf298_kJmol",
        "Cp298_JmolK",
        "V0_Jbar",
        "Tm_K",
        "Hfus_kJmol",
        "Hfus_uncertainty_kJmol",
        "cp",
        "cpRanges",
        "G",
        "gFunction",
        "Tmin_K",
        "Tmax_K",
        "tdbPhase",
        "polymorph",
        "expressionRaw",
        "numbers",
        "property",
        "model",
        "parameters",
        "ternaryParameters",
        "ternaryApproximation",
        "adoptedFrom",
        "series",
        "propertyMeta",
        "nPoints",
        "doi",
        "heatContent",
        "species",
        "systems",
        "numericLPrinted",
        "logKf298",
        "raw298",
        "unitsSource",
        "compounds",
    }
    extras = {k: v for k, v in row.items() if k not in known and v is not None}
    if extras and not props and not raw:
        raw.append(_raw("stagingPhase", phase, extras, list(base_ref)))
    elif extras:
        # Keep rare extras (e.g. logKf298) without dropping them.
        keep = {k: extras[k] for k in ("logKf298", "raw298", "unitsSource") if k in extras}
        if keep:
            raw.append(_raw("stagingExtras", phase, keep, list(base_ref)))

    return {"properties": props, "equations": equations, "raw": raw}


def regressions_to_raw(regressions: dict[str, Any], *, ref: str) -> list[dict[str, Any]]:
    """Koroleva (and similar) regression coefficient sets → raw rows."""
    out: list[dict[str, Any]] = []
    for name, body in regressions.items():
        if not isinstance(body, dict):
            continue
        out.append(
            _raw(
                f"regression_{name}",
                "solid",
                dict(body),
                _ref(ref, body.get("page"), body.get("equation")),
            )
        )
    return out
