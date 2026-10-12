"""Tests for compound_data.writers — file layout, compact refs, sources.json, index lookups."""
from __future__ import annotations

import json
import math

import pytest
from chemicals_fixtures import COMMIT, REPOSITORY

from chemical_formula.organic_family import OrganicFamilyClassifier
from chemicals_tables.constants.equation_type import EquationType
from chemicals_tables.constants.source_tables import SOURCE_TABLES
from chemicals_tables.equation_value import EquationValue
from chemicals_tables.identifier import Identifier
from chemicals_tables.property_value import PropertyValue
from chemicals_tables.raw_value import RawValue
from chemicals_tables.source_entry import SourceEntry
from compound_data.compound_files import compound_files
from compound_data.compound_units import compound_units, property_units
from compound_data.constants.units import EQUATION_UNITS
from compound_data.merger import merge_compounds
from compound_data.writers import (
    write_compound_index, write_compound_json, write_compound_sources, write_compound_units, write_unresolved,
)
from references import RefKey

GENERATED = "2026-10-12T00:00:00+00:00"
BLOB = f"{REPOSITORY}/blob/{COMMIT}/chemicals/"
AL2O3 = "inorganic/Al/Al2O3-aluminium-oxide.json"
TIO2 = "inorganic/Ti/TiO2-titanium-dioxide.json"
NE = "inorganic/Ne/Ne.json"
ETHANOL = "organic/alcohols/C2H6O-ethanol.json"


def _write_all(records, out, unresolved=()):
    files = compound_files(records)
    paths = write_compound_json(files, out)
    write_unresolved(out, list(unresolved), GENERATED)
    index = write_compound_index(files, out, GENERATED)
    return paths, index


def _read(out, path) -> dict:
    return json.loads((out / path).read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def classifier():
    return OrganicFamilyClassifier()


@pytest.fixture
def written(tmp_path, chem, classifier):
    perry = SOURCE_TABLES["Perry 2-151"]
    crc = SOURCE_TABLES["CRC inorganic constants"]
    ids = {
        "1344-28-1": Identifier("1344-28-1", "Al2O3", 101.96, "O=[Al]O[Al]=O", "TWNQ", "aluminium oxide",
                                chem.link(SOURCE_TABLES["Inorganic db"], 12, "aluminium oxide")),
        "13463-67-7": Identifier("13463-67-7", "O2Ti", 79.87, "O=[Ti]=O", None, "titanium dioxide",
                                 chem.link(SOURCE_TABLES["pubchem small"], 5, "titanium dioxide")),
        "64-17-5": Identifier("64-17-5", "C2H6O", 46.07, "CCO", None, "ethanol",
                              chem.link(SOURCE_TABLES["pubchem small"], 7, "ethanol")),
    }
    entries = [
        SourceEntry("1344-28-1", None, "Aluminum oxide (α)", "meltingPoint",
                    PropertyValue(2327.15, RefKey.CRC95, chem.link(crc, 301, "Aluminum oxide (α)", variant="α"))),
        SourceEntry("1344-28-1", "Al2O3", "Al2O3", "heatCapacity",
                    EquationValue(EquationType.linearHyperbolic, RefKey.Perry8, {"a": 22.08, "b": 0.008971,
                                  "d": -522500}, 273, 1973, chem.link(perry, 459, "Al2O3", error=2), k=4.184),
                    "solid"),
        SourceEntry("13463-67-7", None, "Titanium dioxide", "meltingPoint",
                    PropertyValue(2116.15, RefKey.CRC95, chem.link(crc, 9, "Titanium dioxide"))),
        SourceEntry("64-17-5", None, "Ethanol", "boilingPoint",
                    PropertyValue(351.39, RefKey.CRC95, chem.link(crc, 10, "Ethanol"))),
        SourceEntry(None, "Ne", "Ne", "heatCapacity",
                    RawValue("heatCapacity", "gas", RefKey.Perry8, {"a": 4.97}, chem.link(perry, 91, "Ne")),
                    "gas"),
    ]
    merged = merge_compounds(entries, ids, classifier)
    records = list(merged.records.values())
    unresolved = [{"cas": None, "reason": "no CAS and no formula", "values": []}]
    paths, index = _write_all(records, tmp_path, unresolved)
    write_compound_units(tmp_path)
    sources = write_compound_sources(tmp_path, chem, GENERATED)
    return tmp_path, paths, index, sources


def _all_refs(node):
    if isinstance(node, dict):
        for k, v in node.items():
            if k in ("ref", "identifierRef", "tcRef", "rangeRef"):
                if v is not None:
                    yield v
            else:
                yield from _all_refs(v)
    elif isinstance(node, list):
        for item in node:
            yield from _all_refs(item)


class TestFiles:
    def test_paths(self, written):
        out, paths, index, sources = written
        assert [str(p.relative_to(out)) for p in paths] == [AL2O3, NE, TIO2, ETHANOL]
        assert sorted(p.name for p in out.iterdir() if p.is_file()) == [
            "index.json", "sources.json", "units.json", "unresolved.json",
        ]
        assert index == out / "index.json"
        assert sources == out / "sources.json"

    def test_no_meta_in_compound_files(self, written):
        _, paths, _, _ = written
        for path in paths:
            data = json.loads(path.read_text(encoding="utf-8"))
            assert list(data) == ["class", "group", "displayFormula", "hill", "elements", "entries"]

    def test_index_and_unresolved_are_dated(self, written):
        out, _, _, _ = written
        assert _read(out, "index.json")["generatedAt"] == GENERATED
        assert _read(out, "unresolved.json")["count"] == 1

    def test_every_ref_points_to_a_listed_file(self, written):
        out, paths, _, sources = written
        files = json.loads(sources.read_text(encoding="utf-8"))["files"]
        refs = [r for path in paths for r in _all_refs(json.loads(path.read_text(encoding="utf-8")))]
        assert refs
        for ref in refs:
            *ref_key, line, key = ref
            assert key in files and isinstance(line, int)
            assert ref_key == ([files[key]["ref"]] if files[key]["ref"] else [])

    def test_compound_file_layout(self, written):
        out, _, _, _ = written
        data = _read(out, AL2O3)
        assert data["class"] == "inorganic" and data["group"] == "Al" and data["hill"] == "Al2O3"
        assert data["elements"] == ["Al", "O"]
        assert list(data["entries"]) == ["1344-28-1"]
        tio2 = _read(out, TIO2)
        assert (tio2["group"], tio2["displayFormula"], tio2["hill"]) == ("Ti", "TiO2", "O2Ti")
        assert _read(out, ETHANOL)["displayFormula"] == "C2H6O"
        assert _read(out, ETHANOL)["group"] == "alcohols"

    def test_entry_has_no_duplicates_or_empty_fields(self, written):
        out, _, _, _ = written
        entry = _read(out, AL2O3)["entries"]["1344-28-1"]
        assert not {"id", "cas", "hill", "elements", "formula", "families", "raw", "janaf", "otherCas"} & set(entry)
        assert set(_read(out, NE)["entries"]["noCas"]) == {"name", "raw"}

    def test_record_shape(self, written):
        out, _, _, _ = written
        al = _read(out, AL2O3)["entries"]["1344-28-1"]
        solid = al["equations"]["heatCapacity"]["solid"]
        assert solid["def"] == 0
        assert solid["values"][0] == {
            "type": "linearHyperbolic", "ref": ["Perry8", 459, "perry151"],
            "vars": {"a": 22.08, "b": 0.008971, "d": -522500}, "min": 273, "max": 1973, "k": 4.184, "error": 2,
        }
        assert al["properties"]["meltingPoint"] == [
            {"value": 2327.15, "variant": "α", "ref": ["CRC95", 301, "crcConstants"]},
        ]
        assert al["identifierRef"] == [12, "idInorganic"]
        assert "identifierSource" not in al
        assert al["Mr"] == pytest.approx(0.10196)
        ne = _read(out, NE)["entries"]["noCas"]
        assert ne["raw"][0] == {"property": "heatCapacity", "phase": "gas", "values": {"a": 4.97},
                                "ref": ["Perry8", 91, "perry151"]}


class TestSources:
    def test_sources_file(self, written):
        _, _, _, sources = written
        data = json.loads(sources.read_text(encoding="utf-8"))
        assert data["repository"] == REPOSITORY
        assert data["sourceCommit"] == COMMIT
        assert data["sourceTree"] == f"{REPOSITORY}/tree/{COMMIT}"
        assert data["license"] == "MIT"
        assert data["lineUrl"] == "{url}#L{line}"
        assert len(data["files"]) == len(SOURCE_TABLES)
        assert data["files"]["perry151"] == {
            "name": "Perry 2-151", "path": "chemicals/Heat Capacity/Perrys Table 2-151.tsv", "ref": "Perry8",
            "url": f"{BLOB}Heat%20Capacity/Perrys%20Table%202-151.tsv",
        }
        assert data["files"]["idInorganic"]["ref"] is None
        for entry in data["files"].values():
            assert entry["url"].startswith(BLOB) and " " not in entry["url"]

    def test_file_keys_are_unique(self):
        keys = [t.key for t in SOURCE_TABLES.values()]
        assert len(keys) == len(set(keys))


class TestIndex:
    def test_lookups(self, written):
        _, _, index, _ = written
        data = json.loads(index.read_text(encoding="utf-8"))
        assert list(data["byElement"]) == sorted(data["byElement"])
        assert data["byElement"]["Ti"] == ["13463-67-7"]
        assert data["byFormula"]["Al2O3"] == ["1344-28-1"]
        assert data["byFamily"]["alcohols"] == ["64-17-5"]
        assert data["compounds"]["13463-67-7"]["file"] == TIO2
        assert data["compounds"]["13463-67-7"]["group"] == "Ti"
        assert data["compounds"]["1344-28-1"]["equations"] == {"heatCapacity": ["solid"]}
        assert data["compounds"]["1344-28-1"]["refs"] == ["CRC95", "Perry8"]
        assert data["equationTypes"] == {"linearHyperbolic": "implemented"}
        assert data["byOtherCas"] == {}

    def test_entry_location(self, written):
        out, _, index, _ = written
        data = json.loads(index.read_text(encoding="utf-8"))
        for record_id, entry in data["compounds"].items():
            file = _read(out, entry["file"])
            assert file["hill"] == entry["hill"]
            assert entry["entry"] in file["entries"], record_id
        assert data["compounds"]["formula:Ne"]["entry"] == "noCas"
        assert "families" not in data["compounds"]["13463-67-7"]

    def test_unknown_cas_is_listed(self, tmp_path, chem, classifier):
        perry = SOURCE_TABLES["Perry 2-151"]
        ids = {"7429-90-5": Identifier("7429-90-5", "Al", 26.98, "[Al]", None, "aluminum",
                                       chem.link(SOURCE_TABLES["pubchem small"], 1774, "aluminum"))}
        entries = [
            SourceEntry("7429-90-5", None, "Aluminum", "meltingPoint",
                        PropertyValue(933.47, RefKey.CRC95, chem.link(SOURCE_TABLES["CRC inorganic constants"], 3))),
            SourceEntry("3303-34-2", "Al", "Al", "heatCapacity",
                        EquationValue(EquationType.linearHyperbolic, RefKey.Perry8, {"a": 4.8, "b": 0.00322, "d": 0},
                                      273, 931, chem.link(perry, 160, "Al")), "solid"),
        ]
        records = list(merge_compounds(entries, ids, classifier).records.values())
        _, index_path = _write_all(records, tmp_path)
        index = json.loads(index_path.read_text(encoding="utf-8"))
        al = _read(tmp_path, "inorganic/Al/Al-aluminum.json")["entries"]
        assert list(al) == ["7429-90-5"]
        assert al["7429-90-5"]["otherCas"] == ["3303-34-2"]
        assert al["7429-90-5"]["equations"]["heatCapacity"]["solid"]["values"][0]["ref"] == ["Perry8", 160, "perry151"]
        assert index["byOtherCas"] == {"3303-34-2": "7429-90-5"}

    def test_no_nan(self, written):
        _, paths, index, sources = written
        for path in [*paths, index, sources]:
            json.loads(path.read_text(encoding="utf-8"), parse_constant=lambda c: pytest.fail(f"{c} in {path}"))

    def test_nan_is_rejected(self, tmp_path, chem, classifier):
        crc = SOURCE_TABLES["CRC inorganic constants"]
        entry = SourceEntry("7440-37-1", "Ar", "Ar", "meltingPoint",
                            PropertyValue(math.nan, RefKey.CRC95, chem.link(crc, 2)))
        records = list(merge_compounds([entry], {}, classifier).records.values())
        with pytest.raises(ValueError):
            write_compound_json(compound_files(records), tmp_path)


class TestLayout:
    def _records(self, chem, classifier, ids):
        crc = SOURCE_TABLES["CRC inorganic constants"]
        entries = [SourceEntry(cas, None, ident.name, "meltingPoint", PropertyValue(1000.0, RefKey.CRC95,
                               chem.link(crc, i + 2))) for i, (cas, ident) in enumerate(ids.items())]
        return list(merge_compounds(entries, ids, classifier).records.values())

    def _ident(self, chem, cas, formula, smiles, name):
        return Identifier(cas, formula, 100.0, smiles, None, name, chem.link(SOURCE_TABLES["pubchem small"], 1, name))

    def test_inorganic_cas_share_one_file_named_by_lowest_cas(self, chem, classifier):
        ids = {cas: self._ident(chem, cas, "Bi2O3", None, name) for cas, name in [
            ("11090-09-8", "Bi2O3"), ("12048-50-9", "bismuth tetroxide"), ("1304-76-3", "Bismuth oxide (Bi2O3)"),
        ]}
        files = compound_files(self._records(chem, classifier, ids))
        assert [f.path for f in files] == ["inorganic/Bi/Bi2O3-bismuth-oxide-bi2o3.json"]
        assert list(files[0].entries) == ["1304-76-3", "11090-09-8", "12048-50-9"]

    def test_organic_isomers_get_own_files_and_families(self, chem, classifier):
        ids = {"64-17-5": self._ident(chem, "64-17-5", "C2H6O", "CCO", "ethanol"),
               "115-10-6": self._ident(chem, "115-10-6", "C2H6O", "COC", "dimethyl ether")}
        files = compound_files(self._records(chem, classifier, ids))
        assert [f.path for f in files] == [
            "organic/alcohols/C2H6O-ethanol.json", "organic/ethers/C2H6O-dimethyl-ether.json",
        ]

    def test_oxides_go_to_main_element(self, chem, classifier):
        ids = {"13463-67-7": self._ident(chem, "13463-67-7", "O2Ti", "O=[Ti]=O", "titanium dioxide"),
               "7664-41-7": self._ident(chem, "7664-41-7", "H3N", "N", "ammonia")}
        assert [f.path for f in compound_files(self._records(chem, classifier, ids))] == [
            "inorganic/N/NH3-ammonia.json", "inorganic/Ti/TiO2-titanium-dioxide.json",
        ]

    def test_carbon_class_from_bonds_and_overrides(self, chem, classifier):
        ids = {"56-23-5": self._ident(chem, "56-23-5", "CCl4", "ClC(Cl)(Cl)Cl", "carbon tetrachloride"),
               "144-55-8": self._ident(chem, "144-55-8", "CHNaO3", "C(=O)(O)[O-].[Na+]", "sodium bicarbonate"),
               "74-90-8": self._ident(chem, "74-90-8", "CHN", "C#N", "hydrogen cyanide"),
               "57-13-6": self._ident(chem, "57-13-6", "CH4N2O", "NC(N)=O", "urea")}
        assert [f.path for f in compound_files(self._records(chem, classifier, ids))] == [
            "inorganic/C/HCN-hydrogen-cyanide.json", "inorganic/Na/NaHCO3-sodium-bicarbonate.json",
            "organic/amides/CH4N2O-urea.json", "organic/halogenated/CCl4-carbon-tetrachloride.json",
        ]


class TestUnits:
    def test_units_file(self, written):
        out, _, _, _ = written
        data = _read(out, "units.json")
        assert data == compound_units()
        assert data["Mr"] == "kg/mol" and data["temperature"] == "K"
        assert data["properties"]["criticalPressure"] == "Pa"
        assert data["properties"]["enthalpyFormation298"] == "J/mol"
        assert data["equations"]["viscosity"] == "Pa s"

    def test_every_property_has_a_unit(self, written):
        out, _, index, _ = written
        units = property_units()
        for entry in json.loads(index.read_text(encoding="utf-8"))["compounds"].values():
            assert set(entry.get("properties", [])) <= set(units)
            assert set(entry.get("equations", {})) <= set(EQUATION_UNITS)
