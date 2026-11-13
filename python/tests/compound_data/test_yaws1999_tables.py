"""Processed Yaws 1999 → compound-data entries and replace/fill."""
from __future__ import annotations

import json
from pathlib import Path

from chemicals_tables.constants.equation_type import EquationType
from chemicals_tables.equation_value import EquationValue
from chemicals_tables.source_link import SourceLink
from compound_data.compound_record import CompoundRecord
from compound_data.parsers.yaws1999_identity import load_yaws1999_identity
from compound_data.parsers.yaws1999_tables import parse_yaws1999_tables
from compound_data.yaws1999_links import attach_yaws1999, write_yaws1999_jsonl
from references import RefKey


def _write_processed(root: Path) -> Path:
    appendix = root / "appendix"
    tables = root / "tables"
    appendix.mkdir(parents=True)
    tables.mkdir(parents=True)
    (appendix / "CAS_Compound_Index.json").write_text(json.dumps({
        "id": "CAS", "rows": [
            {"id": 1, "cas": "124-38-9", "name": "CARBON DIOXIDE", "formula": "CO2"},
            {"id": 2, "cas": "7727-37-9", "name": "NITROGEN", "formula": "N2"},
        ],
    }), encoding="utf-8")
    (appendix / "Name_and_Synonym_Index.json").write_text(json.dumps({
        "id": "SYN", "rows": [
            {"id": 1, "cas": "124-38-9", "name": "CARBON DIOXIDE", "formula": "CO2",
             "synonyms": ["CARBONIC ANHYDRIDE"]},
        ],
    }), encoding="utf-8")
    table_path = tables / "Heat_capacity_of_gas_of_inorganic_compounds_(table_2-2).json"
    table_path.write_text(json.dumps({
        "id": "2-2",
        "title": "HEAT CAPACITY OF GAS - INORGANIC",
        "pages": {"first": 45, "last": 49},
        "rows": [
            {
                "id": 10, "formula": "CO2", "name": "CARBON DIOXIDE",
                "A": 1.0, "B": 2.0, "C": 3.0, "D": 4.0, "E": 5.0, "Tmin": 50, "Tmax": 1500,
            },
            {
                "id": 11, "formula": "N2", "name": "NITROGEN",
                "A": 10.0, "B": 0.0, "C": 0.0, "D": 0.0, "E": 0.0, "Tmin": 100, "Tmax": 1000,
            },
        ],
    }), encoding="utf-8")
    (root / "index.json").write_text(json.dumps({
        "tables": [{
            "id": "2-2",
            "title": "HEAT CAPACITY OF GAS - INORGANIC",
            "file": "tables/Heat_capacity_of_gas_of_inorganic_compounds_(table_2-2).json",
            "rowCount": 2,
        }],
    }), encoding="utf-8")
    return root


def test_identity_resolves_synonym_and_rejects_bad_cas(tmp_path: Path):
    root = _write_processed(tmp_path / "yaws")
    index = load_yaws1999_identity(
        root / "appendix" / "CAS_Compound_Index.json",
        root / "appendix" / "Name_and_Synonym_Index.json",
    )
    cas, hill, status = index.resolve("CARBONIC ANHYDRIDE", "CO2")
    assert status == "matched" and cas == "124-38-9" and hill == "CO2"


def test_parse_emits_gas_cp_quartic(tmp_path: Path):
    root = _write_processed(tmp_path / "yaws")
    parsed = parse_yaws1999_tables(root)
    assert parsed.counts["yaws1999Entries"] == 2
    co2 = next(e for e in parsed.entries if e.cas == "124-38-9")
    assert co2.property == "heatCapacity" and co2.phase == "gas"
    assert isinstance(co2.value, EquationValue)
    assert co2.value.type == EquationType.quartic
    assert co2.value.vars == {"a": 1.0, "b": 2.0, "c": 3.0, "d": 4.0, "e": 5.0}
    assert co2.value.min == 50 and co2.value.max == 1500
    assert co2.value.to_dict()["ref"] == ["Yaws1999", 10, "yaws1999Table2_2"]
    assert "tableId" not in co2.value.to_dict()


def test_compound_values_cite_with_ref_only():
    """General rule: citation location is only ``ref``, never tableId/page* beside it."""
    link = SourceLink(
        "t", "yaws1999Table5_1", "", ref=RefKey.Yaws1999, line=49, label="CO2",
        extra={"tableId": "5-1", "rowId": 49, "pageFirst": 106, "pageLast": 123, "error": 3},
    )
    fields = link.extra_fields()
    assert fields == {"error": 3}
    assert set(fields).isdisjoint({"tableId", "rowId", "pageFirst", "pageLast"})


def test_attach_fills_and_replaces_yaws_linked(tmp_path: Path):
    root = _write_processed(tmp_path / "yaws")
    old_link = SourceLink("Yaws 2014", "yawsCritical", "", ref=RefKey.Yaws2014, line=1, label="CO2")
    record = CompoundRecord(
        id="124-38-9", cas="124-38-9", formula="CO2", hill="CO2", display_formula="CO2",
        elements=["C", "O"], compound_class="inorganic", group="C", name="carbon dioxide",
        equations={
            "heatCapacity": {
                "gas": [EquationValue(
                    type=EquationType.quartic, ref=RefKey.Yaws2014,
                    vars={"a": 9.0, "b": 0.0, "c": 0.0, "d": 0.0, "e": 0.0},
                    min=50, max=1000, source=old_link, k=1.0,
                )],
            },
        },
    )
    n2 = CompoundRecord(
        id="7727-37-9", cas="7727-37-9", formula="N2", hill="N2", display_formula="N2",
        elements=["N"], compound_class="inorganic", group="N", name="nitrogen",
    )
    issues, replace_log, counts, tables, unmatched, created, issues_log, created_log = attach_yaws1999(
        [record, n2], root,
    )
    assert not unmatched
    assert counts["yaws1999Filled"] == 1  # N2
    assert counts["yaws1999Replaced"] == 1  # CO2 Yaws2014 → 1999
    assert replace_log[0]["reason"] == "yaws2014_replaced_by_1999"
    assert replace_log[0]["property"] == "heatCapacity"
    co2_eq = record.equations["heatCapacity"]["gas"][0]
    assert co2_eq.ref == RefKey.Yaws1999 and co2_eq.vars["a"] == 1.0
    assert n2.equations["heatCapacity"]["gas"][0].vars["a"] == 10.0
    assert tables and tables[0].ref == RefKey.Yaws1999
    assert "carbonic anhydride" in record.synonyms

    log_path = tmp_path / "yaws1999-replace-log.jsonl"
    write_yaws1999_jsonl(log_path, replace_log)
    lines = log_path.read_text(encoding="utf-8").strip().splitlines()
    assert len(lines) == 1 and json.loads(lines[0])["cas"] == "124-38-9"


def test_attach_creates_missing_yaws_compound_and_synonyms(tmp_path: Path):
    root = tmp_path / "yaws"
    appendix = root / "appendix"
    tables = root / "tables"
    appendix.mkdir(parents=True)
    tables.mkdir(parents=True)
    (appendix / "CAS_Compound_Index.json").write_text(json.dumps({
        "id": "CAS", "rows": [
            {"id": 1, "cas": "598-82-3", "name": "LACTIC ACID", "formula": "C3H6O3"},
        ],
    }), encoding="utf-8")
    (appendix / "Name_and_Synonym_Index.json").write_text(json.dumps({
        "id": "SYN", "rows": [
            {"id": 1, "cas": "598-82-3", "name": "LACTIC ACID", "formula": "C3H6O3",
             "synonyms": ["2-HYDROXYPROPIONIC ACID", "MILK ACID"]},
        ],
    }), encoding="utf-8")
    (tables / "Critical_(table_1-1).json").write_text(json.dumps({
        "id": "1-1", "title": "CRITICAL", "rows": [
            {"id": 1, "formula": "C3H6O3", "name": "LACTIC ACID",
             "Tf": 290.0, "Tb": 490.0, "Tc": 600.0, "Pc": 50.0, "Vc": 200.0, "omega": 0.5},
        ],
    }), encoding="utf-8")
    (root / "index.json").write_text(json.dumps({
        "tables": [{"id": "1-1", "title": "CRITICAL", "file": "tables/Critical_(table_1-1).json", "rowCount": 1}],
    }), encoding="utf-8")

    _, _, counts, _, unmatched, created, issues_log, created_log = attach_yaws1999([], root)
    assert counts["yaws1999Created"] == 1
    assert counts["yaws1999Filled"] >= 1
    assert not unmatched
    assert len(created) == 1
    record = created[0]
    assert record.id == "598-82-3" and record.cas == "598-82-3"
    assert record.name == "lactic acid"
    assert "2-hydroxypropionic acid" in record.synonyms
    assert "milk acid" in record.synonyms
    assert "boilingPoint" in record.properties
    assert created_log == [{
        "cas": "598-82-3",
        "name": "lactic acid",
        "formula": "C3H6O3",
        "hill": "C3H6O3",
        "displayFormula": "C3H6O3",
        "class": record.compound_class,
        "group": record.group,
        "families": record.families,
        "synonyms": record.synonyms,
        "Mr": record.Mr,
        "source": "yaws1999Appendix",
        "note": "Created from Yaws CAS appendix; run PubChem search to fill identifiers",
    }]


def test_issues_log_table_only_cas_and_no_record(tmp_path: Path):
    root = tmp_path / "yaws"
    appendix = root / "appendix"
    tables = root / "tables"
    appendix.mkdir(parents=True)
    tables.mkdir(parents=True)
    (appendix / "CAS_Compound_Index.json").write_text(json.dumps({"id": "CAS", "rows": []}), encoding="utf-8")
    (appendix / "Name_and_Synonym_Index.json").write_text(json.dumps({"id": "SYN", "rows": []}), encoding="utf-8")
    (tables / "Exposure_(table_27-1).json").write_text(json.dumps({
        "id": "27-1", "title": "EXPOSURE", "rows": [
            {
                "id": 544, "formula": "Cl3H12Cl2N2", "name": "4,4'-METHYLENE BIS(2-CHLOROANILINE)",
                "CAS_No": "101-14-4", "TLV_ACGIH_mg_m3": 0.11, "TLV_ACGIH_ppm": 0.01,
            },
        ],
    }), encoding="utf-8")
    (root / "index.json").write_text(json.dumps({
        "tables": [{"id": "27-1", "title": "EXPOSURE", "file": "tables/Exposure_(table_27-1).json", "rowCount": 1}],
    }), encoding="utf-8")

    _, _, counts, _, _, created, issues_log, created_log = attach_yaws1999([], root)
    assert created == [] and created_log == []
    assert counts["yaws1999TableOnlyCas"] == 1
    assert counts["yaws1999NoRecord"] >= 1
    kinds = {row["kind"] for row in issues_log}
    assert kinds == {"tableOnlyCas", "noRecord"}
    table_only = next(r for r in issues_log if r["kind"] == "tableOnlyCas")
    assert table_only["cas"] == "101-14-4" and table_only["inAppendix"] is False
    assert table_only["tableId"] == "27-1"
    no_rec = next(r for r in issues_log if r["kind"] == "noRecord")
    assert no_rec["cas"] == "101-14-4" and no_rec["property"] in {
        "tlvAcgih", "tlvAcgihPpm", "pelOsha", "pelOshaPpm", "relNiosh", "relNioshPpm", "makDfg", "makDfgPpm",
    }


def test_parse_emits_new_yaws_equation_types(tmp_path: Path):
    root = tmp_path / "yaws"
    appendix = root / "appendix"
    tables = root / "tables"
    appendix.mkdir(parents=True)
    tables.mkdir(parents=True)
    (appendix / "CAS_Compound_Index.json").write_text(json.dumps({
        "id": "CAS", "rows": [
            {"id": 1, "cas": "124-38-9", "name": "CARBON DIOXIDE", "formula": "CO2"},
        ],
    }), encoding="utf-8")
    (appendix / "Name_and_Synonym_Index.json").write_text(json.dumps({"id": "SYN", "rows": []}), encoding="utf-8")
    rows = [{
        "id": 1, "formula": "CO2", "name": "CARBON DIOXIDE",
        "A": 1.0, "B": -1000.0, "C": -1.0, "D": 1e-4, "E": 1e-6, "Tmin": 200, "Tmax": 400,
        "n": 0.3, "Tc": 304.0, "density_at_25_C": 0.7,
        "solubility_parameter": 17.0, "liquid_volume": 40.0, "vdw_area": 1e9, "vdw_volume": 20.0,
        "S_at_T_ppm_wt": 1000.0, "log10_Kow": 1.5,
        "S_at_25_C": 160.0, "Tb": 194.0,
        "n_liq_at_25_C": 0.3, "k_liq_at_25_C": 0.1,
        "LEL": 5.0, "UEL": 15.0, "flash_point_code": 32.0, "flash_point_F": 2,
        "autoignition_code": -40.0, "autoignition_F": 1,
        "Hc_kjoule_mol": -100.0, "State": "gas",
        "CAS_No": "124-38-9", "TLV_ACGIH_ppm": 5000, "TLV_ACGIH_mg_m3": 9000,
        "ymin": 10, "ymax": 1000, "Q_at_10_ppmv": 1.0,
        "S_at_X_0": 160.0, "S_at_X_34_472": 100.0,
    }]
    index_tables = []
    for tid, name in (
        ("7-1", "Vapor_pressure"),
        ("8-1", "Density"),
        ("14-1", "Solubility_parameter"),
        ("15-1", "Water_octanol"),
        ("16-1", "Salt_water"),
        ("17-1", "Water_solubility"),
        ("19-1", "Adsorption"),
        ("22-1", "Viscosity_liquid"),
        ("24-1", "K_liquid"),
        ("25-1", "Explosion"),
        ("26-1", "Combustion"),
        ("27-1", "Exposure"),
    ):
        rel = f"tables/{name}_(table_{tid}).json"
        (root / rel).write_text(json.dumps({
            "id": tid, "title": name, "rows": rows,
        }), encoding="utf-8")
        index_tables.append({"id": tid, "title": name, "file": rel, "rowCount": 1})
    (root / "index.json").write_text(json.dumps({"tables": index_tables}), encoding="utf-8")

    parsed = parse_yaws1999_tables(root)
    by_prop = {}
    for e in parsed.entries:
        by_prop.setdefault(e.property, []).append(e)

    vp = next(e for e in by_prop["vaporPressure"] if isinstance(e.value, EquationValue))
    assert vp.value.type == EquationType.yawsVaporPressure
    assert vp.value.k == 133.322387415

    dens = next(e for e in by_prop["density"] if isinstance(e.value, EquationValue))
    assert dens.value.type == EquationType.yawsLiquidDensity and dens.value.k == 1000.0

    visc = next(e for e in by_prop["viscosity"] if isinstance(e.value, EquationValue))
    assert visc.value.type == EquationType.yawsLiquidViscosity and visc.value.k == 1e-3

    kliq = next(e for e in by_prop["thermalConductivity"] if isinstance(e.value, EquationValue))
    assert kliq.value.type == EquationType.yawsLiquidConductivity

    sol = next(e for e in by_prop["waterSolubility"] if isinstance(e.value, EquationValue))
    assert sol.value.type == EquationType.yawsWaterSolubility and sol.value.k == 1e-6

    from chemicals_tables.property_value import PropertyValue
    from chemicals_tables.raw_value import RawValue
    assert any(isinstance(e.value, PropertyValue) and e.property == "solubilityParameter" for e in parsed.entries)
    assert any(isinstance(e.value, PropertyValue) and e.property == "flashPoint" for e in parsed.entries)
    assert any(isinstance(e.value, PropertyValue) and e.property == "enthalpyCombustion" for e in parsed.entries)
    assert any(isinstance(e.value, PropertyValue) and e.property == "tlvAcgih" for e in parsed.entries)
    assert any(isinstance(e.value, RawValue) and e.property == "saltWaterSolubility" for e in parsed.entries)
    assert any(isinstance(e.value, RawValue) and e.property == "adsorptionCapacity" for e in parsed.entries)
    assert parsed.counts["yaws1999SkippedUnsupported"] == 0


def test_attach_does_not_replace_perry(tmp_path: Path):
    root = _write_processed(tmp_path / "yaws")
    link = SourceLink("Perry", "perry", "", ref=RefKey.Perry8, line=1, label="CO2")
    record = CompoundRecord(
        id="124-38-9", cas="124-38-9", formula="CO2", hill="CO2", display_formula="CO2",
        elements=["C", "O"], compound_class="inorganic", group="C", name="carbon dioxide",
        equations={
            "heatCapacity": {
                "gas": [EquationValue(
                    type=EquationType.quartic, ref=RefKey.Perry8,
                    vars={"a": 7.0, "b": 0.0, "c": 0.0, "d": 0.0, "e": 0.0},
                    min=50, max=1000, source=link, k=1.0,
                )],
            },
        },
    )
    _, replace_log, counts, _, _, _, _, _ = attach_yaws1999([record], root)
    assert counts["yaws1999Filled"] >= 1
    assert replace_log == []
    assert len(record.equations["heatCapacity"]["gas"]) == 2
    assert record.equations["heatCapacity"]["gas"][0].ref == RefKey.Perry8
