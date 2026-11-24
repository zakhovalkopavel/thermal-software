from metal_data.approximation import apply_approximations
from metal_data.donor import apply_donor_fill
from metal_data.models import AlloyRecord, PropertySeries


def _rec(mid, family, comp, points, prop="thermalConductivity"):
    r = AlloyRecord(material_id=mid, name=mid, group="steel", family=family, composition=comp)
    if points is not None:
        r.properties[prop] = PropertySeries(
            points=[{"T_K": 273.15 + t, "T_C": float(t), "value": v} for t, v in points],
            unit="W/(m·K)" if prop != "thermalExpansion" else "1e-6/K",
            sources=["test"],
        )
    return r


def test_donor_full_series_is_link_not_copy():
    dense = _rec(
        "sae-1008",
        "carbon",
        {"C": 0.08, "Mn": 0.4},
        [(0, 60), (100, 55), (200, 50), (300, 45), (400, 40)],
    )
    sparse = _rec(
        "sae-1010",
        "carbon",
        {"C": 0.10, "Mn": 0.45},
        [(100, 54)],
    )
    apply_donor_fill({dense.material_id: dense, sparse.material_id: sparse})
    series = sparse.properties["thermalConductivity"]
    assert series.donor["mode"] == "full-series"
    assert "scale" not in series.donor
    assert series.donor["materialId"] == "sae-1008"
    # Own single point retained; donor knots not copied
    assert len(series.points) == 1
    assert abs(series.points[0]["value"] - 54) < 1e-9


def test_donor_zero_points_empty_series_with_link():
    dense = _rec(
        "sae-1008",
        "carbon",
        {"C": 0.08, "Mn": 0.4},
        [(0, 60), (100, 55), (200, 50), (300, 45), (400, 40)],
    )
    empty = _rec("sae-3450", "carbon", {"C": 0.5, "Mn": 0.45}, None)
    apply_donor_fill({dense.material_id: dense, empty.material_id: empty})
    series = empty.properties["thermalConductivity"]
    assert series.points == []
    assert series.donor["materialId"] == "sae-1008"
    assert "doesn't have thermalConductivity points" in series.donor["why"]
    assert "link" in series.donor["why"]
    assert "ElMD=" in series.donor["why"]
    assert "L1=" in series.donor["why"]
    assert "wt%" in series.donor["why"]
    assert "ΔC=" in series.donor["why"]
    assert "ΔMn=" in series.donor["why"]
    assert series.donor["distanceMetric"] == "ElMD-mod_petti"
    assert series.donor["compositionDistance"] >= 0


def test_scaled_series_keeps_own_points_only():
    dense = _rec(
        "sae-1008",
        "carbon",
        {"C": 0.08, "Mn": 0.4},
        [(0, 60), (100, 55), (200, 50), (300, 45), (400, 40)],
    )
    sparse = _rec(
        "sae-1010",
        "carbon",
        {"C": 0.10, "Mn": 0.45},
        [(100, 60.5), (300, 49.5)],
    )
    apply_donor_fill({dense.material_id: dense, sparse.material_id: sparse})
    series = sparse.properties["thermalConductivity"]
    assert series.donor["mode"] == "scaled-series"
    assert abs(series.donor["scale"] - 1.1) < 0.05
    assert "error" in series.donor
    assert len(series.points) == 2
    assert {round(p["value"], 1) for p in series.points} == {60.5, 49.5}


def test_extend_outside_range_does_not_merge_exterior_knots():
    dense = _rec(
        "sae-1015",
        "carbon",
        {"C": 0.15, "Mn": 0.4},
        [
            (0, 11.5),
            (100, 11.9),
            (200, 12.5),
            (300, 13.0),
            (400, 13.6),
            (500, 14.0),
            (600, 14.2),
            (700, 14.8),
        ],
        prop="thermalExpansion",
    )
    target = _rec(
        "sae-1025",
        "carbon",
        {"C": 0.25, "Mn": 0.45},
        [(100, 12.0), (400, 13.5), (600, 14.4)],
        prop="thermalExpansion",
    )
    registry = {dense.material_id: dense, target.material_id: target}
    apply_approximations(registry)
    apply_donor_fill(registry)
    series = target.properties["thermalExpansion"]
    assert series.donor["mode"] == "extend-outside-range"
    assert "scale" in series.donor
    assert len(series.points) == 3
    assert max(p["T_K"] for p in series.points) < 1000
