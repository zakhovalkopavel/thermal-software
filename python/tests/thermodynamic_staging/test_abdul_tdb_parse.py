"""Tests for Abdul TDB → compact G(T) dataset."""

from __future__ import annotations

import math
from pathlib import Path

from thermodynamic_staging.abdul_tdb_parse import build_abdul_dataset, parse_abdul_tdb_file
from thermodynamic_staging.paths import report_dir, repo_root


def _tdb_path() -> Path:
    root = repo_root()
    p = report_dir(root) / "texts" / "abdul-2023" / "appendix-b.tdb.txt"
    if p.is_file():
        return p
    return root / "tmp/reports/python/minerals-thermodynamic/texts/abdul-2023/appendix-b.tdb.txt"


def test_build_from_minimal_snippet() -> None:
    snippet = """
FUNCTION CA0 1 (1 - EXP(-1047.38873/T)); 10000 N !
FUNCTION CA1 1 (1 - EXP(-458.837521/T)); 10000 N !
FUNCTION CA2 1 (1 - EXP(-178.6963/T)); 10000 N !
FUNCTION GCA 1 (-2.349750735736110E6
+ 68.6331374908854*T*LN(CA0)
+ 68.17219790106598*T*LN(CA1)
+ 37.79837958926666*T*LN(CA2)
- 0.0006602887929999997*T**2
- 7.06344541E-07*T**3); 6000 N !
"""
    data = build_abdul_dataset(snippet)
    g = data["phases"]["CA"]["G"]
    assert g is not None
    assert abs(g["H0_Jmol"] + 2.349750735736110e6) < 1.0
    assert g["a2"] is not None and g["a2"] < 0
    assert len(g["einstein"]) == 3
    assert abs(g["einstein"][0]["theta_K"] - 1047.38873) < 1e-6


def test_parse_ca_and_evaluate_at_298() -> None:
    path = _tdb_path()
    assert path.is_file(), f"missing TDB text at {path}; run thermodynamic-staging-extract"
    data = parse_abdul_tdb_file(path)
    ca = data["phases"]["CA"]
    assert ca["phaseId"] == "monocalcium-aluminate"
    assert ca["status"] == "ok"
    g = ca["G"]
    assert abs(g["H0_Jmol"] + 2.349750735736110e6) < 1.0
    assert len(g["einstein"]) == 3
    assert all(e["theta_K"] is not None for e in g["einstein"])

    T = 298.15
    value = g["H0_Jmol"]
    if g.get("a2"):
        value += g["a2"] * T**2
    if g.get("a3"):
        value += g["a3"] * T**3
    for e in g["einstein"]:
        value += e["prefactor"] * T * math.log(1.0 - math.exp(-e["theta_K"] / T))
    assert math.isfinite(value)
    assert value < -1e6
    assert data["nLiquidExcess"] > 0
