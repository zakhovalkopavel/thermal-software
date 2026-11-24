"""
chemical_formula — Chemical formula parsing, Hill and IUPAC notation and compound classification.

Shared by compound_data (merge and grouping), pubchem (formula of a PubChem answer) and the JANAF links.

Sub-modules
-----------
  chemical_formula.formula_cleaner            — clean_formula (footnote numbers, spaces)
  chemical_formula.formula_elements           — formula_elements (element counts; adducts, isotopes, charges)
  chemical_formula.formula_text               — formula_text (counts in a given element order)
  chemical_formula.hill_formula               — hill_formula (counts → Hill notation, the lookup key)
  chemical_formula.iupac_formula              — iupac_formula (counts → IUPAC element order, inorganic display)
  chemical_formula.main_element               — main_element (element folder of an inorganic compound)
  chemical_formula.compound_class             — classify_compound (inorganic / organic)
  chemical_formula.organic_bonds              — has_organic_bond (RDKit; import the module directly)
  chemical_formula.organic_family             — OrganicFamilyClassifier (RDKit SMARTS; import the module directly)
  chemical_formula.formula_family             — formula_family (family the formula alone fixes, without SMILES)
  chemical_formula.constants.organic_families — family name → SMARTS
  chemical_formula.constants.electronegativity — Pauling electronegativities
  chemical_formula.constants.element_groups   — non-metals, halogens, hydrogen isotopes
  chemical_formula.constants.element_sequence — IUPAC Table VI element sequence

Spec
----
  docs/scripts/COMPOUND_DATA_SPEC.md
"""

from chemical_formula.compound_class   import classify_compound
from chemical_formula.formula_cleaner  import clean_formula
from chemical_formula.formula_elements import ELEMENTS, ISOTOPES, formula_elements
from chemical_formula.formula_family   import formula_family
from chemical_formula.formula_text     import formula_text
from chemical_formula.hill_formula     import hill_formula
from chemical_formula.iupac_formula    import iupac_formula
from chemical_formula.main_element     import main_element

__all__ = [
    "classify_compound",
    "clean_formula",
    "ELEMENTS",
    "formula_elements",
    "formula_family",
    "formula_text",
    "hill_formula",
    "iupac_formula",
    "ISOTOPES",
    "main_element",
]
