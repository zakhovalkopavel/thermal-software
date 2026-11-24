"""Tests for identity overrides of rows without CAS or formula, and CID parsing of the identifier files."""
from __future__ import annotations

import pytest

from chemicals_tables.constants.equation_type import EquationType
from chemicals_tables.constants.source_tables import SOURCE_TABLES
from chemicals_tables.equation_value import EquationValue
from chemicals_tables.identity_override import IdentityOverride
from chemicals_tables.identity_resolver import apply_identity_overrides
from chemicals_tables.parsers.identifiers import _cid
from chemicals_tables.property_value import PropertyValue
from chemicals_tables.source_entry import SourceEntry
from references import RefKey


class TestIdentityOverrides:
    def test_poling_normal_hydrogen(self, chem):
        poling = SOURCE_TABLES["Poling databank"]
        entry = SourceEntry(None, None, "hydrogen, normal", "heatCapacity298",
                            PropertyValue(28.83, RefKey.Poling5, chem.link(poling, 367, "hydrogen, normal"), "gas"))
        issues = apply_identity_overrides([entry])
        assert (entry.cas, entry.formula) == ("1333-74-0", "H2")
        assert entry.value.to_dict()["variant"] == "normal"
        assert issues[0]["issue"] == "identityOverride" and issues[0]["line"] == 367

    def test_zabransky_pentaethoxyuranium(self, chem):
        zab = SOURCE_TABLES["Zabransky"]
        entry = SourceEntry(None, None, "Pentaethoxyuranium", "heatCapacity",
                            EquationValue(EquationType.zabranskySpline, RefKey.Zabransky1996, {}, 257.5, 400,
                                          chem.link(zab, 2, "Pentaethoxyuranium")), "liquid")
        apply_identity_overrides([entry])
        assert (entry.cas, entry.formula) == (None, "C10H25O5U")
        assert entry.smiles == "CCO[U](OCC)(OCC)(OCC)OCC"

    def test_other_rows_untouched(self, chem):
        poling = SOURCE_TABLES["Poling databank"]
        entry = SourceEntry("56-23-5", None, "tetrachloromethane", "heatCapacity298",
                            PropertyValue(83.43, RefKey.Poling5, chem.link(poling, 12), "gas"))
        assert apply_identity_overrides([entry], {("poling", 13): IdentityOverride("X", "r")}) == []
        assert entry.cas == "56-23-5"


@pytest.mark.parametrize("cell, cid", [("702", 702), ("-1", None), ("", None)])
def test_identifier_cid(cell, cid):
    assert _cid(cell) == cid
