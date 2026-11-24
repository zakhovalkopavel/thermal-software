"""Tests for formula parsing, Hill and IUPAC notation, compound class, organic bonds and families."""
from __future__ import annotations

import pytest
from rdkit import Chem
from rdkit.Chem.rdMolDescriptors import CalcMolFormula

from chemical_formula.compound_class import classify_compound
from chemical_formula.formula_cleaner import clean_formula
from chemical_formula.formula_elements import formula_elements
from chemical_formula.formula_family import formula_family
from chemical_formula.hill_formula import hill_formula
from chemical_formula.iupac_formula import iupac_formula
from chemical_formula.main_element import main_element
from chemical_formula.organic_bonds import has_organic_bond
from chemical_formula.organic_family import OrganicFamilyClassifier


class TestFormulaElements:
    def test_ca_and_cl_are_not_carbon(self):
        assert formula_elements("CaCl2") == {"Ca": 1, "Cl": 2}

    def test_oxide_notation_with_multipliers(self):
        assert formula_elements("4Al2O3·3SiO2") == {"Al": 8, "O": 18, "Si": 3}

    def test_dot_adduct_and_parentheses(self):
        assert formula_elements("2KCl·CuCl2.2H2O") == {"Cl": 4, "Cu": 1, "H": 4, "K": 2, "O": 2}
        assert formula_elements("Al2(SO4)3·18H2O") == {"Al": 2, "H": 36, "O": 30, "S": 3}

    def test_decimal_counts(self):
        assert formula_elements("AlF3·3.5H2O") == {"Al": 1, "F": 3, "H": 7, "O": 3.5}
        assert formula_elements("Fe0.947O") == {"Fe": 0.947, "O": 1}

    def test_isotopes_count_as_element(self):
        assert formula_elements("H2[18O]") == {"H": 2, "O": 1}
        assert formula_elements("D2O") == {"H": 2, "O": 1}

    def test_unknown_symbol_raises(self):
        with pytest.raises(ValueError):
            formula_elements("Pcl3")


class TestCleanAndHill:
    def test_perry_footnote_prefix(self):
        assert clean_formula("22 SO2 ") == "SO2"
        assert clean_formula("4Al2O3·3SiO2") == "4Al2O3·3SiO2"
        assert clean_formula("  ") is None

    def test_hill(self):
        assert hill_formula({"O": 3, "Al": 2}) == "Al2O3"
        assert hill_formula({"O": 1, "H": 6, "C": 2}) == "C2H6O"
        assert hill_formula({"Cl": 1, "H": 1}) == "ClH"


class TestIupacFormula:
    @pytest.mark.parametrize("formula, expected", [
        ("TiO2", "TiO2"), ("TiI", "TiI"), ("TiF4", "TiF4"), ("ZnB4O9", "ZnB4O9"), ("Al2SiO5", "Al2SiO5"),
        ("Al6Si2O13", "Al6Si2O13"), ("MgAl2O4", "MgAl2O4"), ("TiOCl2", "TiOCl2"), ("SiC", "SiC"),
        ("Na2CO3", "Na2CO3"), ("SO3", "SO3"), ("XeF2", "XeF2"), ("Fe0.947O", "Fe0.947O"),
        ("NH3", "NH3"), ("N2H4", "N2H4"), ("NH4Cl", "NH4Cl"), ("HCl", "HCl"), ("H2S", "H2S"), ("AlH3", "AlH3"),
        ("H2O", "H2O"), ("H2O2", "H2O2"), ("OF2", "OF2"), ("S2Cl2", "S2Cl2"),
    ])
    def test_element_sequence(self, formula, expected):
        assert iupac_formula(formula_elements(formula)) == expected

    @pytest.mark.parametrize("formula, expected", [
        ("ClO2", "ClO2"), ("Cl2O7", "Cl2O7"), ("I2O5", "I2O5"), ("HClO4", "HClO4"), ("FClO3", "ClO3F"),
        ("NaClO2", "NaClO2"), ("KClO4", "KClO4"), ("AgBrO3", "AgBrO3"), ("LiIO3", "LiIO3"),
        ("Ba(ClO3)2", "BaCl2O6"), ("CrO2Cl2", "CrO2Cl2"), ("TiOCl2", "TiOCl2"),
    ])
    def test_halogen_oxides_put_the_halogen_first(self, formula, expected):
        assert iupac_formula(formula_elements(formula)) == expected

    @pytest.mark.parametrize("formula, expected", [
        ("HNO3", "HNO3"), ("H2SO4", "H2SO4"), ("H3PO4", "H3PO4"), ("H3BO3", "H3BO3"), ("H2CO3", "H2CO3"),
        ("NaHCO3", "NaHCO3"), ("KH2PO4", "KH2PO4"), ("NH4NO3", "N2H4O3"), ("(NH4)2SO4", "N2H8SO4"),
        ("HCN", "HCN"), ("HNCO", "HCNO"),
    ])
    def test_oxoacids_and_acid_salts_put_hydrogen_after_the_metals(self, formula, expected):
        assert iupac_formula(formula_elements(formula)) == expected

    @pytest.mark.parametrize("formula, expected", [("NaOH", "NaOH"), ("Mg(OH)2", "MgO2H2"), ("Ba(OH)2", "BaO2H2")])
    def test_hydroxides_put_hydrogen_after_oxygen(self, formula, expected):
        assert iupac_formula(formula_elements(formula)) == expected

    def test_deuterium_follows_hydrogen(self):
        assert iupac_formula({"D": 2, "O": 1}) == "D2O"
        assert iupac_formula({"D": 3, "N": 1}) == "ND3"


class TestClassify:
    @pytest.mark.parametrize("formula, group", [("Al2O3", "Al"), ("TiO2", "Ti"), ("NaCl", "Na"), ("NH3", "N")])
    def test_inorganic_group_is_main_element(self, formula, group):
        assert classify_compound(formula_elements(formula)) == ("inorganic", group)

    @pytest.mark.parametrize("formula, expected", [
        ("CH4", ("organic", None)), ("CCl4", ("organic", None)), ("C2F6", ("organic", None)),
        ("CO2", ("inorganic", "C")), ("CS2", ("inorganic", "C")), ("CaCO3", ("inorganic", "Ca")),
        ("NaHCO3", ("inorganic", "Na")), ("K4Fe(CN)6", ("inorganic", "K")), ("C60", ("inorganic", "C")),
        ("C2N2", ("organic", None)), ("C3O2", ("organic", None)), ("C2O", ("organic", None)),
        ("CaC2", ("inorganic", "Ca")), ("B4C", ("inorganic", "B")), ("CN", ("inorganic", "C")),
    ])
    def test_formula_rule_without_structure(self, formula, expected):
        assert classify_compound(formula_elements(formula)) == expected

    def test_structure_answer_wins(self):
        assert classify_compound(formula_elements("CHN"), organic=False) == ("inorganic", "C")
        assert classify_compound(formula_elements("C2N2"), organic=True) == ("organic", None)

    def test_structure_answer_ignored_without_carbon_and_for_elemental_carbon(self):
        assert classify_compound(formula_elements("H2O"), organic=True) == ("inorganic", "O")
        assert classify_compound(formula_elements("C60"), organic=True) == ("inorganic", "C")

    def test_deuterium_counts_as_hydrogen(self):
        assert classify_compound(["C", "D"]) == ("organic", None)
        assert classify_compound(["D", "O"]) == ("inorganic", "O")


class TestOrganicBonds:
    @pytest.mark.parametrize("smiles", [
        "C", "CCO", "[2H]C([2H])([2H])[2H]", "ClC(Cl)(Cl)Cl", "FC(F)(F)C(F)(F)F", "O=C(Cl)Cl",
        "C(#N)C(=C(C#N)C#N)C#N", "NC(N)=O", "NC1=NC(N)=NC(N)=N1", "[O-]C(=O)C.[Na+]",
        "C1(=NC(=NC(=N1)N=[N+]=[N-])N=[N+]=[N-])N=[N+]=[N-]", "N#CC#N", "O=C=C=C=O", "S=C=C=C=S",
    ])
    def test_organic(self, smiles):
        assert has_organic_bond(smiles) is True

    @pytest.mark.parametrize("smiles", [
        "O=C=O", "[C-]#[O+]", "S=C=S", "C(=O)(O)[O-].[Na+]", "[C-]#N.[K+]", "C(=O)([O-])[O-].O.O.[Mg+2]",
        "[C-]#[C].[La]", "C(=O)(C(=O)[O-])[O-].[Ca+2]", "C(#N)N.[Ca+2]", "[C-]#[O+].[C-]#[O+].[Ni]",
        "B12B3C14B2B43",
    ])
    def test_inorganic(self, smiles):
        assert has_organic_bond(smiles) is False

    def test_no_structure(self):
        assert has_organic_bond(None) is None
        assert has_organic_bond("not a smiles") is None


class TestMainElement:
    @pytest.mark.parametrize("formula, element", [
        ("Al2O3", "Al"), ("TiO2", "Ti"), ("Fe2O3", "Fe"), ("SiO2", "Si"),
        ("NH3", "N"), ("N2H4", "N"), ("NH4Cl", "N"), ("HNO3", "N"),
        ("H2SO4", "S"), ("HCl", "Cl"), ("CO2", "C"), ("SiC", "Si"), ("BN", "B"),
        ("CaCO3", "Ca"), ("MgAl2O4", "Mg"), ("Na3AlF6", "Na"), ("Al2SiO5", "Al"), ("KOH", "K"),
        ("Mo2B", "Mo"), ("PbTe", "Pb"), ("XeF2", "Xe"), ("OF2", "O"),
        ("H2O", "O"), ("H2O2", "O"), ("H2", "H"), ("Ar", "Ar"), ("Al", "Al"),
    ])
    def test_main_element(self, formula, element):
        assert main_element(formula_elements(formula)) == element

    def test_no_elements_raises(self):
        with pytest.raises(ValueError):
            main_element([])


class TestOrganicFamilies:
    @pytest.fixture(scope="class")
    def classifier(self):
        return OrganicFamilyClassifier()

    @pytest.mark.parametrize("smiles, group", [
        ("CCO", "alcohols"),
        ("c1ccccc1", "aromatics"),
        ("CC(=O)O", "carboxylic-acids"),
        ("CCOC(C)=O", "esters"),
        ("C=O", "aldehydes"),
        ("CC", "alkanes"),
        ("C", "alkanes"),
        ("C#C", "alkynes"),
        ("C=C=C", "alkenes"),
        ("C=C=O", "alkenes"),
        ("[O-]C(=O)C.[Na+]", "carboxylic-acids"),
        ("C(=O)(C(=O)[O-])[O-].[NH4+].[NH4+]", "carboxylic-acids"),
        ("N#CC#N", "nitriles"),
    ])
    def test_group(self, classifier, smiles, group):
        assert classifier.group(smiles) == group

    def test_lists_every_match(self, classifier):
        assert classifier.families("CCO") == ["alcohols", "alkanes"]

    def test_no_smiles_is_unclassified(self, classifier):
        assert classifier.group(None) == "unclassified"
        assert classifier.group("not a smiles") == "unclassified"


class TestFormulaFamily:
    @pytest.mark.parametrize("formula, family", [
        ("CH4", "alkanes"), ("C16H34", "alkanes"), ("C2H4", "alkenes"), ("C2H2", "alkynes"),
        ("CCl3F", "halogenated"), ("CF2", "halogenated"), ("C2Cl4F2", "halogenated"), ("CBr", "halogenated"),
        ("CFO", "halogenated"), ("CF8S", "sulfur"), ("C3H8S", "sulfur"), ("C6H5Cl3Si", "organosilicon"),
        ("C4H10Zn", "organometallic"), ("CD4", "alkanes"),
    ])
    def test_formula_fixes_family(self, formula, family):
        assert formula_family(formula_elements(formula)) == family

    @pytest.mark.parametrize("formula", ["CH3", "C2H", "CHO", "C3H6", "C3H9N", "C2H3ClO", "CHP", "CH2N2", "B4C"])
    def test_structure_dependent_is_none(self, formula):
        assert formula_family(formula_elements(formula)) is None

    @pytest.mark.parametrize("smiles", [
        "C", "CCCC", "C=C", "C#C", "ClC(Cl)(Cl)F", "FC(F)(F)S(F)(F)(F)(F)F", "CCSC", "C[Si](C)(C)Cl",
        "CC[Zn]CC", "FC(Cl)=C(Cl)Cl", "O=[C]F", "C1CC1Br",
    ])
    def test_agrees_with_smarts(self, smiles):
        family = formula_family(formula_elements(CalcMolFormula(Chem.MolFromSmiles(smiles))))
        assert family == OrganicFamilyClassifier().group(smiles)
