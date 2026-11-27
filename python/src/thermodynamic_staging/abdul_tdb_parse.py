"""Parse Abdul (2023) Appendix B TDB text into a compact calculable dataset.

Refs:
  [62] Abdul2023

3rd-generation solid form (typical):
  G(T) = H0 + a2*T^2 + a3*T^3 + sum_i [ b_i * T * ln(1 - exp(-theta_i/T)) ]
Einstein helpers are ``FUNCTIONs`` of shape ``(1 - EXP(-theta/T))``.
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any

# TDB phase / G-function → compounds.json phaseId + formula
PHASE_MAP: dict[str, dict[str, str]] = {
    "CA": {"phaseId": "monocalcium-aluminate", "formula": "CaAl2O4", "gFunction": "GCA"},
    "CA2": {"phaseId": "grossite", "formula": "CaAl4O7", "gFunction": "GCA2"},
    "CA6": {"phaseId": "hibonite", "formula": "CaAl12O19", "gFunction": "GCA6"},
    "C3A": {"phaseId": "tricalcium-aluminate", "formula": "Ca3Al2O6", "gFunction": "GC3A"},
    "C12A7": {"phaseId": "mayenite", "formula": "Ca12Al14O33", "gFunction": "GHC12A7S"},
    "CAS2": {"phaseId": "anorthite", "formula": "CaAl2Si2O8", "gFunction": "GCAS2"},
    "C2AS": {"phaseId": "gehlenite", "formula": "Ca2Al2SiO7", "gFunction": "GC2AS"},
    "WCS": {"phaseId": "wollastonite", "formula": "CaSiO3", "gFunction": "GWCS"},
    "PCS": {"phaseId": "pseudowollastonite", "formula": "CaSiO3", "gFunction": "GPCS"},
    "RC3S2": {"phaseId": "rankinite", "formula": "Ca3Si2O7", "gFunction": "GRC3S2"},
    "AC2S": {"phaseId": "dicalcium-silicate", "formula": "Ca2SiO4", "gFunction": "GAC2S", "polymorph": "alpha"},
    "APC2S": {"phaseId": "dicalcium-silicate", "formula": "Ca2SiO4", "gFunction": "GAPC2S", "polymorph": "alpha-prime"},
    "BC2S": {"phaseId": "larnite", "formula": "Ca2SiO4", "gFunction": "GBC2S", "polymorph": "beta"},
    "GC2S": {"phaseId": "calcio-olivine", "formula": "Ca2SiO4", "gFunction": "GGC2S", "polymorph": "gamma"},
    "MC3S": {"phaseId": "tricalcium-silicate", "formula": "Ca3SiO5", "gFunction": "GMC3S", "polymorph": "M"},
    "TC3S": {"phaseId": "tricalcium-silicate", "formula": "Ca3SiO5", "gFunction": "GTC3S", "polymorph": "T"},
    "RC3S": {"phaseId": "tricalcium-silicate", "formula": "Ca3SiO5", "gFunction": "GRC3S", "polymorph": "R"},
    "AQUARTZ": {"phaseId": "quartz", "formula": "SiO2", "gFunction": "GAQUARTZ", "polymorph": "alpha"},
    "BQUARTZ": {"phaseId": "quartz", "formula": "SiO2", "gFunction": "GBQUARTZ", "polymorph": "beta"},
    "ACRIS": {"phaseId": "cristobalite", "formula": "SiO2", "gFunction": "GACRIS", "polymorph": "alpha"},
    "BCRIS": {"phaseId": "cristobalite", "formula": "SiO2", "gFunction": "GBCRIS", "polymorph": "beta"},
    "CAO": {"phaseId": "lime", "formula": "CaO", "gFunction": "GCAO"},
    "CORUNDUM": {"phaseId": "corundum", "formula": "Al2O3", "gFunction": "GCOR"},
    "AKER": {"phaseId": "akermanite", "formula": "Ca2MgSi2O7", "gFunction": "GAKER"},
    "MER": {"phaseId": "merwinite", "formula": "Ca3MgSi2O8", "gFunction": "GMER"},
    "M2S": {"phaseId": "forsterite", "formula": "Mg2SiO4", "gFunction": "GM2S"},
    "PMS": {"phaseId": "enstatite", "formula": "MgSiO3", "gFunction": "GPMS", "polymorph": "proto"},
    "OMS": {"phaseId": "enstatite", "formula": "MgSiO3", "gFunction": "GOMS", "polymorph": "ortho"},
    "CMS": {"phaseId": "enstatite", "formula": "MgSiO3", "gFunction": "GCMS", "polymorph": "clino"},
    "MULLITE": {"phaseId": "mullite", "formula": "Al6Si2O13", "gFunction": "GSIL"},
}

_NUM_NC = r"[-+]?(?:\d+\.?\d*|\.\d+)(?:[Ee][-+]?\d+)?"
_NUM = rf"({_NUM_NC})"
_PAGE_NOISE = re.compile(r"^\s*\d{2,4}\s*$")


def _strip_noise(text: str) -> str:
    lines = []
    for line in text.splitlines():
        if _PAGE_NOISE.match(line):
            continue
        # Thermo-Calc comments start with `$` (including "$ LIQUID PHASE FUNCTIONS").
        if re.match(r"^\s*\$", line):
            continue
        lines.append(line)
    return "\n".join(lines)


def _statements(text: str) -> list[str]:
    """Split Thermo-Calc style statements ending with ``!``."""
    cleaned = _strip_noise(text)
    parts = re.split(r"!\s*", cleaned)
    out = []
    for part in parts:
        s = re.sub(r"\s+", " ", part).strip()
        if s:
            out.append(s)
    return out


def parse_functions(text: str) -> dict[str, dict[str, Any]]:
    """Parse ``FUNCTION name lowT expr; highT N`` statements."""
    functions: dict[str, dict[str, Any]] = {}
    for stmt in _statements(text):
        if not stmt.upper().startswith("FUNCTION "):
            continue
        m = re.match(
            rf"FUNCTION\s+(\S+)\s+{_NUM}\s+(.+?)\s*;\s*{_NUM}\s+N\s*$",
            stmt,
            re.I,
        )
        if not m:
            # Some statements omit lowT as 0.1 etc still match; try looser
            m = re.match(
                rf"FUNCTION\s+(\S+)\s+{_NUM}\s+(.+);\s*{_NUM}",
                stmt,
                re.I,
            )
        if not m:
            continue
        name, t_low, expr, t_high = m.group(1), float(m.group(2)), m.group(3).strip(), float(m.group(4))
        # Drop trailing N
        expr = re.sub(r"\s+N\s*$", "", expr, flags=re.I).strip()
        entry: dict[str, Any] = {
            "name": name,
            "Tmin_K": t_low,
            "Tmax_K": t_high,
            "expression": expr,
        }
        ein = re.fullmatch(rf"\(1\s*-\s*EXP\(-{_NUM}/T\)\)", expr.replace(" ", ""), re.I)
        if not ein:
            ein = re.fullmatch(
                rf"\(1\s*-\s*EXP\(\s*-{_NUM}\s*/\s*T\s*\)\)",
                expr,
                re.I,
            )
        if ein:
            entry["kind"] = "einstein_factor"
            entry["theta_K"] = float(ein.group(1))
        else:
            entry["kind"] = "expression"
        functions[name] = entry
    return functions


def _lookup_fn(functions: dict[str, dict[str, Any]], name: str) -> dict[str, Any] | None:
    if name in functions:
        return functions[name]
    for k, v in functions.items():
        if k.upper() == name.upper():
            return v
    return None


def _parse_g_polynomial(expr: str, functions: dict[str, dict[str, Any]]) -> dict[str, Any] | None:
    """Extract H0, T^2, T^3 and Einstein terms (helper refs or inline ln(1-exp))."""
    flat = expr.replace(" ", "").replace("#", "")
    r_gas = 8.31446261815324

    h0 = 0.0
    m_paren = re.match(rf"^\+\(-{_NUM}\)", flat)
    m_lead = re.match(rf"^\(?{_NUM}", flat)
    if m_paren:
        h0 = -float(m_paren.group(1))
    elif m_lead:
        h0 = float(m_lead.group(1))
    else:
        return None

    # Zero-point terms (3/2)*R*n*theta (with optional parentheses around n, theta)
    for m in re.finditer(
        rf"\(3\.0/2\)\*8\.31446261815324\*\(?{_NUM}\)?\*\(?{_NUM}\)?",
        flat,
    ):
        h0 += (3.0 / 2.0) * r_gas * float(m.group(1)) * float(m.group(2))

    a2 = None
    m2 = re.search(rf"{_NUM}\*T\*\*2", flat)
    if m2:
        a2 = float(m2.group(1))
    a3 = None
    m3 = re.search(rf"{_NUM}\*T\*\*3", flat)
    if m3:
        a3 = float(m3.group(1))

    einstein: list[dict[str, Any]] = []
    for m in re.finditer(
        rf"{_NUM}\*T\*LN\(([A-Za-z0-9_]+)\)",
        flat,
        re.I,
    ):
        pref = float(m.group(1))
        ref = m.group(2)
        helper = _lookup_fn(functions, ref)
        theta = helper["theta_K"] if helper and helper.get("kind") == "einstein_factor" else None
        einstein.append({"prefactor": pref, "factorFunction": ref, "theta_K": theta})

    # Inline akermanite/merwinite style:
    #   3*R*T*(n)*ln(1-exp(-(theta)/T))
    for m in re.finditer(
        rf"({_NUM_NC})\*({_NUM_NC})\*T\*\(({_NUM_NC})\)\*ln\(1-exp\(-\(({_NUM_NC})\)/T\)\)",
        flat,
        re.I,
    ):
        pref = float(m.group(1)) * float(m.group(2)) * float(m.group(3))
        theta = float(m.group(4))
        einstein.append({"prefactor": pref, "factorFunction": None, "theta_K": theta})
    # Simpler inline: pref*T*ln(1-exp(-theta/T))
    if not any(e.get("factorFunction") is None and e.get("theta_K") for e in einstein):
        for m in re.finditer(
            rf"({_NUM_NC})\*T\*ln\(1-exp\(-({_NUM_NC})/T\)\)",
            flat,
            re.I,
        ):
            einstein.append(
                {
                    "prefactor": float(m.group(1)),
                    "factorFunction": None,
                    "theta_K": float(m.group(2)),
                }
            )

    return {
        "form": "H0 + a2*T^2 + a3*T^3 + sum(prefactor*T*ln(1-exp(-theta/T)))",
        "H0_Jmol": h0,
        "a2": a2,
        "a3": a3,
        "einstein": einstein,
        "units": "J/mol; T in K",
        "rawExpression": expr,
        "R": r_gas,
    }


def _expand_c12a7(functions: dict[str, dict[str, Any]]) -> dict[str, Any] | None:
    """Mayenite: PARAMETER uses 59*GHC12A7S with Einstein Fe/Te triples."""
    r_gas = 8.31446261815324
    g0 = _lookup_fn(functions, "G0C12A7S")
    gt = _lookup_fn(functions, "GTC12A7S")
    if not g0:
        return None
    h0 = float(re.search(_NUM, g0["expression"].replace(" ", "")).group(1))
    a2 = None
    if gt:
        m2 = re.search(rf"{_NUM}\*T\*\*2", gt["expression"].replace(" ", ""))
        if m2:
            a2 = float(m2.group(1))
    einstein = []
    for i in (1, 2, 3):
        fe = _lookup_fn(functions, f"FEC12A7S{i}")
        te = _lookup_fn(functions, f"TEC12A7S{i}")
        if not fe or not te:
            continue
        n_i = float(re.search(_NUM, fe["expression"].replace(" ", "")).group(1))
        theta = float(re.search(_NUM, te["expression"].replace(" ", "")).group(1))
        # GEC12A7S contributes 3*R*T*sum(Fe*ln(1-exp(-Te/T))) plus 1.5*R*sum(Fe*Te) zero-point
        h0 += 1.5 * r_gas * n_i * theta
        einstein.append({"prefactor": 3.0 * r_gas * n_i, "factorFunction": None, "theta_K": theta})
    # Phase parameter is 59 * GHC12A7S
    scale = 59.0
    return {
        "form": "59 * (G0 + EinsteinGE + a2*T^2)",
        "H0_Jmol": scale * h0,
        "a2": (scale * a2) if a2 is not None else None,
        "a3": None,
        "einstein": [
            {"prefactor": scale * e["prefactor"], "factorFunction": None, "theta_K": e["theta_K"]}
            for e in einstein
        ],
        "units": "J/mol; T in K",
        "scale": scale,
        "rawExpression": "59*GHC12A7S",
        "R": r_gas,
    }


def parse_liquid_excess(text: str) -> list[dict[str, Any]]:
    """Parse ``PARAMETER L(LIQUID,...)`` excess interaction terms."""
    rows: list[dict[str, Any]] = []
    for stmt in _statements(text):
        if not stmt.upper().startswith("PARAMETER L(LIQUID"):
            continue
        m = re.match(
            rf"PARAMETER\s+(L\(LIQUID,[^)]+\))\s+{_NUM}\s+(.+?)\s*;\s*{_NUM}",
            stmt,
            re.I,
        )
        if not m:
            continue
        rows.append(
            {
                "parameter": m.group(1),
                "Tmin_K": float(m.group(2)),
                "expression": m.group(3).strip(),
                "Tmax_K": float(m.group(4)),
            }
        )
    return rows


def build_abdul_dataset(tdb_text: str) -> dict[str, Any]:
    """Compact dataset: solid endmembers with G(T) coeffs + liquid excess list."""
    functions = parse_functions(tdb_text)
    phases: dict[str, Any] = {}
    for phase_key, meta in PHASE_MAP.items():
        g_name = meta["gFunction"]
        fn = _lookup_fn(functions, g_name)
        if phase_key == "C12A7":
            parsed = _expand_c12a7(functions)
            phases[phase_key] = {
                "tdbPhase": phase_key,
                "phaseId": meta["phaseId"],
                "formula": meta["formula"],
                "polymorph": meta.get("polymorph"),
                "gFunction": g_name,
                "Tmin_K": 0.1,
                "Tmax_K": 6000.0,
                "G": parsed,
                "convention": "SER",
                "ref": "Abdul2023",
                "status": "ok" if parsed and parsed.get("H0_Jmol") is not None else "expression_only",
            }
            continue
        if fn is None:
            phases[phase_key] = {
                **meta,
                "status": "missing_g_function",
                "gFunction": g_name,
                "ref": "Abdul2023",
            }
            continue
        parsed = _parse_g_polynomial(fn["expression"], functions)
        phases[phase_key] = {
            "tdbPhase": phase_key,
            "phaseId": meta["phaseId"],
            "formula": meta["formula"],
            "polymorph": meta.get("polymorph"),
            "gFunction": g_name,
            "Tmin_K": fn["Tmin_K"],
            "Tmax_K": fn["Tmax_K"],
            "G": parsed,
            "convention": "SER",
            "ref": "Abdul2023",
            "status": "ok" if parsed and parsed.get("H0_Jmol") is not None else "expression_only",
        }

    liquid_g = []
    for stmt in _statements(tdb_text):
        if not stmt.upper().startswith("PARAMETER G(LIQUID"):
            continue
        m = re.match(
            rf"PARAMETER\s+(G\(LIQUID,[^)]+\))\s+{_NUM}\s+(.+?)\s*;\s*{_NUM}",
            stmt,
            re.I,
        )
        if m:
            liquid_g.append(
                {
                    "parameter": m.group(1),
                    "Tmin_K": float(m.group(2)),
                    "expression": m.group(3).strip(),
                    "Tmax_K": float(m.group(4)),
                }
            )

    # Calculable FUNCTION bodies (liquid helpers + Einstein factors). Drop redundant
    # "name" field already present as the dict key.
    functions_out = {
        name: {k: v for k, v in entry.items() if k != "name"}
        for name, entry in functions.items()
    }

    return {
        "source": "Abdul2023",
        "convention": "SER",
        "ref": "Abdul2023",
        "formalism": "3rd-generation CALPHAD (Einstein oscillators) + associate liquid",
        "nFunctions": len(functions_out),
        "nPhases": len(phases),
        "nLiquidExcess": len(parse_liquid_excess(tdb_text)),
        "phases": phases,
        "liquid": {
            "endmemberG": liquid_g,
            "excessL": parse_liquid_excess(tdb_text),
        },
        "functions": functions_out,
        "functionsIndex": sorted(functions_out.keys()),
        "note": (
            "G coefficients are for SER Gibbs energy vs T; do not mix with HSC (Holland–Powell) "
            "without reference-state alignment. `functions` holds every TDB FUNCTION body needed "
            "to evaluate liquid.endmemberG / excessL expressions. Raw TDB text stays under tmp/reports."
        ),
    }


def parse_abdul_tdb_file(path: Path) -> dict[str, Any]:
    return build_abdul_dataset(path.read_text(encoding="utf-8", errors="replace"))
